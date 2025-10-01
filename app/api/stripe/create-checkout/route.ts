import { NextResponse } from "next/server";
import { stripe, subscriptionPrices, creditPrices } from "@/lib/stripeConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjust import path as needed

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id } = await req.json();
    console.log("Stripe Checkout request:", { type, id, userEmail: session.user.email });

    let priceId: string | undefined;
    let mode: "subscription" | "payment" = "payment";
    let credits: string | undefined;

    if (type === "subscription") {
      priceId = subscriptionPrices[id as keyof typeof subscriptionPrices];
      mode = "subscription";
    } else if (type === "credits") {
      priceId = creditPrices[id as keyof typeof creditPrices];
      mode = "payment";
      
      // Map credit package IDs to credit amounts
      const creditAmounts: Record<string, string> = {
        "basic": "100",
        "standard": "250",
        "premium": "500",
        // Add your actual credit package mappings
      };
      credits = creditAmounts[id];
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan or credits selection" },
        { status: 400 }
      );
    }

    // Get userId from database
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customer_email: session.user.email,
      metadata: {
        userId: user.id,
        ...(credits && { credits }), // Only add credits for credit purchases
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}