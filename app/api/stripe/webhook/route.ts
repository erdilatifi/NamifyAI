import { NextResponse } from "next/server";
import Stripe from "stripe";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

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

function isProPrice(params: { priceId: string | null; productId: string | null }) {
  const configured = env.STRIPE_PRO_PRICE_ID;
  if (!configured) return false;

  if (configured.startsWith("price_")) {
    return Boolean(params.priceId) && params.priceId === configured;
  }

  if (configured.startsWith("prod_")) {
    return Boolean(params.productId) && params.productId === configured;
  }

  return false;
}

function mapPlan(params: { status: ReturnType<typeof mapStatus>; priceId: string | null; productId: string | null }) {
  // If subscription is not active/trialing, treat as FREE regardless of the price.
  if (params.status !== "ACTIVE" && params.status !== "TRIALING") return "FREE";
  return isProPrice({ priceId: params.priceId, productId: params.productId }) ? "PRO" : "FREE";
}

async function resolveUserId(params: {
  stripe: Stripe;
  subscription: Stripe.Subscription;
}): Promise<string | null> {
  const fromSubscription = params.subscription.metadata?.userId;
  if (fromSubscription) return fromSubscription;

  const customerId = typeof params.subscription.customer === "string" ? params.subscription.customer : null;
  if (!customerId) return null;

  const fromDb = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    select: { userId: true },
  });
  if (fromDb?.userId) return fromDb.userId;

  try {
    const customer = await params.stripe.customers.retrieve(customerId);
    if (customer && !("deleted" in customer && customer.deleted)) {
      const metaUserId = (customer as Stripe.Customer).metadata?.userId;
      if (metaUserId) return metaUserId;
    }
  } catch {
    // ignore
  }

  return null;
}

export async function POST(req: Request) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const stripe = getStripeClient();

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

  // Idempotency: Stripe may retry events. Ensure we only process each event.id once.
  const alreadyProcessed = await prisma.stripeWebhookEvent.findUnique({ where: { id: event.id } });
  if (alreadyProcessed) {
    return NextResponse.json({ received: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId ?? null;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
    const customerId = typeof session.customer === "string" ? session.customer : null;

    if (!userId || !subscriptionId) {
      console.error("Stripe webhook: checkout.session.completed missing userId/subscription", {
        eventId: event.id,
        sessionId: session.id,
        userId,
        subscriptionId,
        customerId,
      });
      return NextResponse.json({ error: "Missing userId/subscription" }, { status: 500 });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionWithPeriod = subscription as unknown as Stripe.Subscription & {
      current_period_end?: number;
    };

    const itemPrice = subscription.items.data[0]?.price ?? null;
    const priceId = itemPrice?.id ?? null;
    const productId = typeof itemPrice?.product === "string" ? itemPrice.product : itemPrice?.product?.id ?? null;
    const periodEnd = subscriptionWithPeriod.current_period_end
      ? new Date(subscriptionWithPeriod.current_period_end * 1000)
      : null;

    const status = mapStatus(subscription.status);
    const plan = mapPlan({ status, priceId, productId });

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan,
        status,
        stripeCustomerId: customerId ?? undefined,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        currentPeriodEnd: periodEnd,
      },
    });

    await prisma.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        createdAt: new Date(event.created * 1000),
      },
    });

    return NextResponse.json({ received: true });
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
    const userId = await resolveUserId({ stripe, subscription });
    if (!userId) {
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      console.error("Stripe webhook: unable to resolve userId", {
        eventId: event.id,
        type: event.type,
        subscriptionId: subscription.id,
        customerId,
        subscriptionMetadata: subscription.metadata,
      });
      return NextResponse.json({ error: "Unable to resolve userId" }, { status: 500 });
    }

    const itemPrice = subscription.items.data[0]?.price ?? null;
    const priceId = itemPrice?.id ?? null;
    const productId = typeof itemPrice?.product === "string" ? itemPrice.product : itemPrice?.product?.id ?? null;
    const periodEnd = subscriptionWithPeriod.current_period_end
      ? new Date(subscriptionWithPeriod.current_period_end * 1000)
      : null;

    const status = mapStatus(subscription.status);
    const plan = mapPlan({ status, priceId, productId });

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

    await prisma.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        createdAt: new Date(event.created * 1000),
      },
    });

    return NextResponse.json({ received: true });
  }

  await prisma.stripeWebhookEvent.create({
    data: {
      id: event.id,
      type: event.type,
      createdAt: new Date(event.created * 1000),
    },
  });

  return NextResponse.json({ received: true });
}
