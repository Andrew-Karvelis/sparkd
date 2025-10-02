import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripeConfig";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      console.error("Missing signature or webhook secret");
      return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("checkout.session.completed metadata:", session.metadata);

        if (session.metadata?.userId && session.metadata?.credits) {
          try {
            const updatedUser = await prisma.user.update({
              where: { id: session.metadata.userId },
              data: { credits: { increment: Number(session.metadata.credits) } },
            });
            console.log(`Credits updated for user ${updatedUser.id}: +${session.metadata.credits}`);
          } catch (dbError) {
            console.error("Failed to update user credits:", dbError);
          }
        } else {
          console.warn("Missing userId or credits in session metadata:", session.metadata);
        }
        break;
      }

      case "payment_intent.succeeded":
      case "charge.succeeded": {
        const paymentIntentId = (event.data.object as any).payment_intent || (event.data.object as any).id;
        if (!paymentIntentId) {
          console.warn("No payment_intent found on event:", event.type);
          break;
        }

        try {
          // Fetch the checkout session associated with this payment_intent
          const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
          const session = sessions.data[0];

          if (!session) {
            console.warn("No checkout session found for payment_intent:", paymentIntentId);
            break;
          }

          console.log("Retrieved checkout session metadata:", session.metadata);

          if (session.metadata?.userId && session.metadata?.credits) {
            try {
              const updatedUser = await prisma.user.update({
                where: { id: session.metadata.userId },
                data: { credits: { increment: Number(session.metadata.credits) } },
              });
              console.log(`Credits updated for user ${updatedUser.id}: +${session.metadata.credits}`);
            } catch (dbError) {
              console.error("Failed to update user credits (fallback):", dbError);
            }
          } else {
            console.warn("Missing metadata on retrieved checkout session:", session.metadata);
          }
        } catch (err) {
          console.error("Error fetching checkout session by payment_intent:", err);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.error("Payment failed:", {
          id: failedPayment.id,
          error: failedPayment.last_payment_error,
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
