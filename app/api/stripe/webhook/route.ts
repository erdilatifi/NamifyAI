import { NextResponse } from "next/server";
import Stripe from "stripe";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function mapStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "incomplete":
      return "INCOMPLETE";
    case "incomplete_expired":
      return "INCOMPLETE_EXPIRED";
    case "unpaid":
      return "UNPAID";
    default:
      return "INCOMPLETE";
  }
}

export async function POST(req: Request) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const stripe = getStripe();

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionWithPeriod = subscription as unknown as Stripe.Subscription & {
      current_period_end?: number;
    };
    const userId = subscription.metadata?.userId;

    if (userId) {
      const priceId = subscription.items.data[0]?.price?.id ?? null;
      const periodEnd = subscriptionWithPeriod.current_period_end
        ? new Date(subscriptionWithPeriod.current_period_end * 1000)
        : null;

      const status = mapStatus(subscription.status);
      const plan = status === "ACTIVE" || status === "TRIALING" ? "PRO" : "FREE";

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status,
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : null,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          currentPeriodEnd: periodEnd,
        },
        update: {
          plan,
          status,
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : undefined,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          currentPeriodEnd: periodEnd,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
