import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getCurrentMonthPeriod(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start, end };
}

const FREE_LIMIT = 20;
const PRO_LIMIT = 200;

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });

  const isPro = subscription?.plan === "PRO" && subscription?.status === "ACTIVE";
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;

  const now = new Date();
  const { start: periodStart, end: periodEnd } = getCurrentMonthPeriod(now);

  const usage = await prisma.usageTracking.upsert({
    where: { userId_periodStart_periodEnd: { userId, periodStart, periodEnd } },
    create: { userId, periodStart, periodEnd, usedCredits: 0 },
    update: {},
    select: { usedCredits: true, periodStart: true, periodEnd: true },
  });

  return NextResponse.json({
    periodStart: usage.periodStart,
    periodEnd: usage.periodEnd,
    usedCredits: usage.usedCredits,
    limit,
    plan: isPro ? "PRO" : "FREE",
  });
}
