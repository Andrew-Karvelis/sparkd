import { NextResponse } from "next/server";
import { stripe, subscriptionPrices, creditPrices } from "@/lib/stripeConfig";

export async function POST(req: Request) {
  try {
    const { type, id } = await req.json();
    console.log("Stripe Checkout request:", { type, id });

    let priceId: string | undefined;
    let mode: "subscription" | "payment" = "payment";

    if (type === "subscription") {
      priceId = subscriptionPrices[id as keyof typeof subscriptionPrices];
      mode = "subscription";
    } else if (type === "credits") {
      priceId = creditPrices[id as keyof typeof creditPrices];
      mode = "payment";
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan or credits selection" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
