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
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("Payment successful:", {
          sessionId: session.id,
          customerId: session.customer,
          metadata: session.metadata,
        });

        // Update user credits in DB with error handling
        if (session.metadata?.userId && session.metadata?.credits) {
          try {
            const updatedUser = await prisma.user.update({
              where: { id: session.metadata.userId },
              data: { credits: { increment: Number(session.metadata.credits) } },
            });
            console.log(`Credits updated for user ${updatedUser.id}: +${session.metadata.credits}`);
          } catch (dbError) {
            console.error("Failed to update user credits:", dbError);
            // Still return 200 to Stripe to avoid retries
          }
        } else {
          console.warn("Missing userId or credits in session metadata:", session.metadata);
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment succeeded:", paymentIntent.id);
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

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    // Still return 200 to prevent Stripe retries for non-recoverable errors
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}