import dns from "node:dns/promises";
import OpenAI from "openai";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { errorJson, getClientIp, okJson } from "@/lib/api";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

const inputSchema = z.object({
  description: z.string().min(10).max(2000),
  industry: z.string().min(2).max(120),
  tone: z.string().min(2).max(40),
  keywords: z.string().min(1).max(200).optional(),
  count: z.union([z.literal(2), z.literal(4), z.literal(6)]).optional(),
});

function getCurrentMonthPeriod(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start, end };
}

const FREE_LIMIT = 1;
const PRO_LIMIT = 200;

function isProPrice(params: { priceId: string | null }) {
  const configured = env.STRIPE_PRO_PRICE_ID;
  if (!configured) return false;
  if (configured.startsWith("price_")) return Boolean(params.priceId) && params.priceId === configured;
  return false;
}

const suggestionSchema = z.object({
  name: z.string().min(1).max(80),
  tagline: z.string().min(1).max(120).optional(),
});

const modelResponseSchema = z.object({
  suggestions: z.array(suggestionSchema).min(1).max(30),
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

async function rdapHasDomainRegistration(fqdn: string) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(fqdn)}`,
      {
        method: "GET",
        signal: controller.signal,
        headers: {
          "accept": "application/rdap+json, application/json;q=0.9, */*;q=0.8",
        },
      }
    );

    if (res.status === 404) return false;
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("json")) return null;

      const data = (await res.json().catch(() => null)) as
        | null
        | {
            errorCode?: number;
            ldhName?: string;
            handle?: string;
            objectClassName?: string;
          };

      if (!data) return null;
      if (data.errorCode === 404) return false;

      if (typeof data.ldhName === "string" && data.ldhName.length > 0) return true;
      if (typeof data.handle === "string" && data.handle.length > 0) return true;
      if (data.objectClassName === "domain") return true;

      return null;
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function checkDomains(baseLabel: string) {
  const tlds = [".com", ".ai", ".io", ".co", ".app"] as const;
  const fqdnList = tlds.map((tld) => `${baseLabel}${tld}`);

  const results = await Promise.all(
    fqdnList.map(async (fqdn) => {
      const rdap = await rdapHasDomainRegistration(fqdn);
      if (rdap === true) {
        return { fqdn, status: "taken" as const };
      }
      if (rdap === false) {
        return { fqdn, status: "likely_available" as const };
      }

      const hasDns = await resolvesAnyRecord(fqdn);
      return {
        fqdn,
        status: hasDns ? ("taken" as const) : ("unknown" as const),
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
    return errorJson({ status: 401, code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  if (!env.OPENAI_API_KEY) {
    return errorJson({ status: 500, code: "NOT_CONFIGURED", message: "OpenAI is not configured" });
  }

  const userId = session.user.id;
  const ip = getClientIp(req);
  const ipLimit = checkRateLimit({ key: `ai_generate:ip:${ip}`, limit: 30, windowMs: 60_000 });
  if (!ipLimit.allowed) {
    return errorJson({
      status: 429,
      code: "RATE_LIMITED",
      message: "Too many requests",
      headers: rateLimitHeaders({ limit: 30, remaining: ipLimit.remaining, resetAt: ipLimit.resetAt }),
    });
  }

  const userLimit = checkRateLimit({ key: `ai_generate:user:${userId}`, limit: 20, windowMs: 60_000 });
  if (!userLimit.allowed) {
    return errorJson({
      status: 429,
      code: "RATE_LIMITED",
      message: "Too many requests",
      headers: rateLimitHeaders({ limit: 20, remaining: userLimit.remaining, resetAt: userLimit.resetAt }),
    });
  }

  const json = await req.json().catch(() => null);
  const parsed = inputSchema.safeParse(json);
  if (!parsed.success) {
    return errorJson({ status: 400, code: "INVALID_INPUT", message: "Invalid input" });
  }

  try {
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
      select: { id: true, usedCredits: true },
    });

    const { description, industry, tone, keywords } = parsed.data;
    const count = parsed.data.count ?? 4;
    const creditCost = count / 2;

    if (usage.usedCredits + creditCost > limit) {
      return errorJson({ status: 402, code: "USAGE_LIMIT_REACHED", message: "Usage limit reached" });
    }

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const model = process.env.OPENAI_NAME_MODEL || "gpt-4o-mini";

    const system =
      "You are an expert brand strategist. Generate short, brandable, startup-ready business names. Avoid trademarks and well-known brand names. Prefer 1-2 words, easy to pronounce, memorable. Provide optional tagline. Output ONLY valid JSON.";

    const user = {
      description,
      industry,
      tone,
      keywords: keywords ?? null,
      requirements: {
        count,
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
            `Generate exactly ${count} name suggestions for the following. Return ONLY JSON with shape {\"suggestions\":[{\"name\":...,\"tagline\":...}]}. No markdown, no code fences.\n\n` +
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
      return errorJson({ status: 502, code: "BAD_GATEWAY", message: "Invalid model response" });
    }

    const normalized = parsedModel.data.suggestions.slice(0, count).map((s) => ({
      ...s,
      name: normalizeName(s.name),
    }));

    const uniqueNames = Array.from(new Set(normalized.map((s) => s.name)));

    if (uniqueNames.length === 0) {
      return okJson(
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

    await prisma.usageTracking.update({
      where: { id: usage.id },
      data: { usedCredits: { increment: creditCost } },
    });

    return okJson(
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
    return errorJson({ status: 500, code: "INTERNAL_ERROR", message });
  }
}
