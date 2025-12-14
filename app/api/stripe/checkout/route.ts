import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRO_PRICE_ID) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const stripe = getStripe();

  const session = await auth.api.getSession({ headers: req.headers });
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

  const baseUrl = env.BETTER_AUTH_URL;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId },
    },
    metadata: { userId },
    success_url: `${baseUrl}/dashboard/billing?success=1`,
    cancel_url: `${baseUrl}/dashboard/billing?canceled=1`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
