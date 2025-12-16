import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function startOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function addDaysUtc(d: Date, days: number) {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const today = startOfDayUtc(new Date());
  const start = addDaysUtc(today, -6);
  const endExclusive = addDaysUtc(today, 1);

  const rows = await prisma.generatedName.findMany({
    where: {
      userId,
      createdAt: {
        gte: start,
        lt: endExclusive,
      },
    },
    select: { createdAt: true },
  });

  const countsByDay = new Map<string, number>();
  for (const row of rows) {
    const dayKey = startOfDayUtc(row.createdAt).toISOString().slice(0, 10);
    countsByDay.set(dayKey, (countsByDay.get(dayKey) ?? 0) + 1);
  }

  const days = Array.from({ length: 7 }, (_, idx) => {
    const date = addDaysUtc(start, idx);
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      count: countsByDay.get(key) ?? 0,
    };
  });

  return NextResponse.json({ days });
}
