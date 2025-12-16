import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function getBaseUrl(req: Request) {
  const configured = env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured;

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return null;
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRO_PRICE_ID) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const stripe = getStripe();

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const existingSub = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true },
  });

  let customerId = existingSub?.stripeCustomerId ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { userId },
    });

    customerId = customer.id;

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: "FREE",
        status: "ACTIVE",
        stripeCustomerId: customerId,
      },
      update: {
        stripeCustomerId: customerId,
      },
    });
  }

  const baseUrl = getBaseUrl(req);
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_APP_URL", details: { hint: "Set NEXT_PUBLIC_APP_URL to https://namify-ai.vercel.app" } },
      { status: 500 },
    );
  }

  const resolvePriceId = async () => {
    const configured = env.STRIPE_PRO_PRICE_ID;
    if (!configured) {
      throw new Error("Missing STRIPE_PRO_PRICE_ID");
    }
    if (configured.startsWith("price_")) return configured;

    if (configured.startsWith("prod_")) {
      const prices = await stripe.prices.list({
        product: configured,
        active: true,
        limit: 10,
      });

      const recurring = prices.data.find((p) => Boolean(p.recurring));
      if (recurring?.id) return recurring.id;

      throw new Error("No active recurring price found for STRIPE_PRO_PRICE_ID product");
    }

    throw new Error("STRIPE_PRO_PRICE_ID must start with price_ or prod_");
  };

  try {
    const priceId = await resolvePriceId();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId },
      },
      metadata: { userId },
      success_url: `${baseUrl}/payment/success`,
      cancel_url: `${baseUrl}/payment/cancel`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("/api/stripe/checkout error:", err);
    const stripeErr = err as Partial<Stripe.StripeRawError> & { message?: string };
    const message = stripeErr?.message || (err instanceof Error ? err.message : "Stripe checkout failed");
    const details = {
      type: stripeErr?.type,
      code: stripeErr?.code,
      param: stripeErr?.param,
      requestId: stripeErr?.requestId,
    };

    return NextResponse.json({ error: message, details }, { status: 500 });
  }
}
