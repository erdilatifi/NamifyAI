import bcrypt from "bcryptjs";
import { z } from "zod";

import { errorJson, getClientIp, okJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ipLimit = checkRateLimit({ key: `auth_register:ip:${ip}`, limit: 10, windowMs: 60_000 });
  if (!ipLimit.allowed) {
    return errorJson({
      status: 429,
      code: "RATE_LIMITED",
      message: "Too many requests",
      headers: rateLimitHeaders({ limit: 10, remaining: ipLimit.remaining, resetAt: ipLimit.resetAt }),
    });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return errorJson({ status: 400, code: "INVALID_INPUT", message: "Invalid input" });
  }

  const { name, email, password } = parsed.data;

  const emailLimit = checkRateLimit({ key: `auth_register:email:${email.toLowerCase()}`, limit: 5, windowMs: 60_000 });
  if (!emailLimit.allowed) {
    return errorJson({
      status: 429,
      code: "RATE_LIMITED",
      message: "Too many requests",
      headers: rateLimitHeaders({ limit: 5, remaining: emailLimit.remaining, resetAt: emailLimit.resetAt }),
    });
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return errorJson({ status: 409, code: "INVALID_INPUT", message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      emailVerified: false,
    },
    select: { id: true, email: true, name: true },
  });

  return okJson({ user });
}
