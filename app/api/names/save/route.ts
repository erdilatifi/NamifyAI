import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(10).max(2000),
  industry: z.string().min(2).max(120),
  tone: z.string().min(2).max(40),
  keywords: z.string().min(1).max(200).optional(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const created = await prisma.generatedName.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      industry: parsed.data.industry,
      tone: parsed.data.tone,
      keywords: parsed.data.keywords,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id });
}
