import { NextResponse } from "next/server";
import dns from "node:dns/promises";
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

const suggestionSchema = z.object({
  name: z.string().min(1).max(80),
  tagline: z.string().min(1).max(120).optional(),
});

const modelResponseSchema = z.object({
  suggestions: z.array(suggestionSchema).min(5).max(30),
});

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function firstWords(str: string, count: number) {
  return str
    .trim()
    .split(/\s+/g)
    .filter(Boolean)
    .slice(0, count)
    .join(" ");
}

function findAlternativeName(params: {
  baseName: string;
  existingLower: Set<string>;
  industry: string;
  keywords?: string | null;
}) {
  const base = normalizeName(params.baseName);
  const industryWord = firstWords(params.industry, 1);
  const keywordWord = params.keywords ? firstWords(params.keywords, 1) : "";

  const suffixes = ["Labs", "Studio", "Works", "Co", "HQ", "Group", "Solutions", "Systems"];
  const prefixes = [industryWord, keywordWord].filter(Boolean);

  const candidates: string[] = [];
  for (const s of suffixes) {
    candidates.push(`${base} ${s}`);
  }
  for (const p of prefixes) {
    candidates.push(`${p} ${base}`);
  }
  candidates.push(base.replace(/\s+/g, ""));
  candidates.push(`${base} ${industryWord}`.trim());

  for (const c of candidates) {
    const name = normalizeName(c).slice(0, 80);
    if (!name) continue;
    if (!params.existingLower.has(name.toLowerCase())) return name;
  }

  return null;
}

function toDomainLabel(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function resolvesAnyRecord(hostname: string) {
  try {
    const res = await Promise.race([
      dns.resolveAny(hostname),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1800)),
    ]);
    return Array.isArray(res) && res.length > 0;
  } catch {
    return false;
  }
}

async function checkDomains(baseLabel: string) {
  const tlds = [".com", ".ai", ".io", ".co", ".app"] as const;
  const fqdnList = tlds.map((tld) => `${baseLabel}${tld}`);

  const results = await Promise.all(
    fqdnList.map(async (fqdn) => {
      const hasDns = await resolvesAnyRecord(fqdn);
      return {
        fqdn,
        status: hasDns ? ("taken" as const) : ("likely_available" as const),
      };
    })
  );

  return {
    domains: results,
    availableDomains: results.filter((x) => x.status === "likely_available").map((x) => x.fqdn),
  };
}

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

  try {
    const userId = session.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true },
    });

    const isPro =
      subscription?.plan === "PRO" && (subscription?.status === "ACTIVE" || subscription?.status === "TRIALING");
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

    const model = process.env.OPENAI_NAME_MODEL || "gpt-4o-mini";

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

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.9,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            "Generate 10-20 name suggestions for the following. Return ONLY JSON with shape {\"suggestions\":[{\"name\":...,\"tagline\":...}]}. No markdown, no code fences.\n\n" +
            JSON.stringify(user),
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const jsonFromModel = (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })();

    const parsedModel = modelResponseSchema.safeParse(jsonFromModel);
    if (!parsedModel.success) {
      return NextResponse.json({ error: "Invalid model response" }, { status: 502 });
    }

    const normalized = parsedModel.data.suggestions.map((s) => ({
      ...s,
      name: normalizeName(s.name),
    }));

    const uniqueNames = Array.from(new Set(normalized.map((s) => s.name)));

    if (uniqueNames.length === 0) {
      return NextResponse.json(
        {
          suggestions: [],
          model,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const existing = await prisma.generatedName.findMany({
      where: {
        OR: uniqueNames.map((n) => ({
          name: { equals: n, mode: "insensitive" },
        })),
      },
      select: { name: true },
    });

    const existingSet = new Set(existing.map((x) => x.name.toLowerCase()));

    const enriched = await Promise.all(
      normalized.slice(0, 20).map(async (s) => {
        const isTaken = existingSet.has(s.name.toLowerCase());
        const alternative = isTaken
          ? findAlternativeName({
              baseName: s.name,
              existingLower: existingSet,
              industry,
              keywords: keywords ?? null,
            })
          : null;

        const finalName = alternative ?? s.name;
        const baseLabel = toDomainLabel(finalName);
        const domainInfo = baseLabel.length
          ? await checkDomains(baseLabel)
          : { domains: [], availableDomains: [] };

        return {
          name: finalName,
          originalName: isTaken ? s.name : undefined,
          replacedBecauseTaken: isTaken && Boolean(alternative),
          isExistingBusinessName: isTaken,
          tagline: s.tagline,
          domains: domainInfo.domains,
          availableDomains: domainInfo.availableDomains,
        };
      })
    );

    return NextResponse.json(
      {
        suggestions: enriched,
        model,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
