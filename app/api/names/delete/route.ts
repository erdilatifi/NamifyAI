import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  generatedNameId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const userId = session.user.id;

  const owned = await prisma.generatedName.findFirst({
    where: { id: parsed.data.generatedNameId, userId },
    select: { id: true },
  });

  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.generatedName.delete({
    where: { id: parsed.data.generatedNameId },
  });

  return NextResponse.json({ ok: true });
}
