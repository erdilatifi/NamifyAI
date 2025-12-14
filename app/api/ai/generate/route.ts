import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const inputSchema = z.object({
  description: z.string().min(10).max(2000),
  industry: z.string().min(2).max(120),
  tone: z.string().min(2).max(40),
  keywords: z.string().min(1).max(200).optional(),
});

function getCurrentMonthPeriod(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start, end };
}

const FREE_LIMIT = 20;
const PRO_LIMIT = 200;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI is not configured" }, { status: 500 });
  }

  const json = await req.json().catch(() => null);
  const parsed = inputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
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
    select: { id: true, usedCredits: true },
  });

  if (usage.usedCredits >= limit) {
    return NextResponse.json({ error: "Usage limit reached" }, { status: 402 });
  }

  await prisma.usageTracking.update({
    where: { id: usage.id },
    data: { usedCredits: { increment: 1 } },
  });

  const { description, industry, tone, keywords } = parsed.data;

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const system =
    "You are NamifyAI, an expert brand strategist. Generate short, brandable, startup-ready business names. Avoid trademarks and well-known brand names. Prefer 1-2 words, easy to pronounce, memorable. Provide optional tagline. Output ONLY valid JSON.";

  const user = {
    description,
    industry,
    tone,
    keywords: keywords ?? null,
    requirements: {
      count: 15,
      disallow: ["trademarked names", "existing famous companies"],
      includeDomainHint: true,
    },
    outputSchema: {
      suggestions: [
        {
          name: "string",
          tagline: "string (optional)",
          domainHint: "string (optional; e.g. 'might be available as .com/.ai')",
        },
      ],
    },
  };

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.9,
    stream: true,
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content:
          "Generate 10-20 name suggestions for the following. Return ONLY JSON with shape {\"suggestions\":[{\"name\":...,\"tagline\":...,\"domainHint\":...}]}. No markdown, no code fences.\n\n" +
          JSON.stringify(user),
      },
    ],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const token = chunk.choices?.[0]?.delta?.content;
          if (token) controller.enqueue(encoder.encode(token));
        }
      } catch {
        controller.enqueue(encoder.encode(""));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
