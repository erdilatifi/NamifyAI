import { auth } from "@/lib/auth";
import { errorJson, okJson } from "@/lib/api";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getCurrentMonthPeriod(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start, end };
}

const FREE_LIMIT = 20;
const PRO_LIMIT = 200;

function isProPrice(params: { priceId: string | null }) {
  const configured = env.STRIPE_PRO_PRICE_ID;
  if (!configured) return false;
  if (configured.startsWith("price_")) return Boolean(params.priceId) && params.priceId === configured;
  return false;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return errorJson({ status: 401, code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const userId = session.user.id;

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true, stripePriceId: true },
  });

  const isActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";
  const isPro = Boolean(isActive) && (subscription?.plan === "PRO" || isProPrice({ priceId: subscription?.stripePriceId ?? null }));
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;

  const now = new Date();
  const { start: periodStart, end: periodEnd } = getCurrentMonthPeriod(now);

  const usage = await prisma.usageTracking.upsert({
    where: { userId_periodStart_periodEnd: { userId, periodStart, periodEnd } },
    create: { userId, periodStart, periodEnd, usedCredits: 0 },
    update: {},
    select: { usedCredits: true, periodStart: true, periodEnd: true },
  });

  return okJson({
    periodStart: usage.periodStart,
    periodEnd: usage.periodEnd,
    usedCredits: usage.usedCredits,
    limit,
    plan: isPro ? "PRO" : "FREE",
    status: subscription?.status ?? null,
  });
}
