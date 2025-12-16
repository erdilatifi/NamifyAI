import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const stripe = getStripe();

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "No customer" }, { status: 400 });
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("/api/stripe/portal error:", err);
    const stripeErr = err as Partial<Stripe.StripeRawError> & { message?: string };
    const message = stripeErr?.message || (err instanceof Error ? err.message : "Stripe portal failed");
    const details = {
      type: stripeErr?.type,
      code: stripeErr?.code,
      param: stripeErr?.param,
      requestId: stripeErr?.requestId,
    };

    return NextResponse.json({ error: message, details }, { status: 500 });
  }
}
