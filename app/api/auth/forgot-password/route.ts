import crypto from "crypto";
import { z } from "zod";

import { errorJson, getClientIp, okJson } from "@/lib/api";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ipLimit = checkRateLimit({ key: `auth_forgot_password:ip:${ip}`, limit: 10, windowMs: 60_000 });
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

  const email = parsed.data.email;

  const emailLimit = checkRateLimit({
    key: `auth_forgot_password:email:${email.toLowerCase()}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!emailLimit.allowed) {
    return errorJson({
      status: 429,
      code: "RATE_LIMITED",
      message: "Too many requests",
      headers: rateLimitHeaders({ limit: 5, remaining: emailLimit.remaining, resetAt: emailLimit.resetAt }),
    });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  // Always return 200 to avoid user enumeration.
  if (!user) {
    return okJson({});
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expiresAt,
    },
  });

  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(
    email
  )}`;

  if (env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const resend = new Resend(env.RESEND_API_KEY);

    await resend.emails.send({
      from: "NamifyAI <no-reply@namifyai.local>",
      to: email,
      subject: "Reset your password",
      text: `Reset your password using this link (valid for 30 minutes):\n\n${resetUrl}`,
    });
  } else {
    console.log("[forgot-password] RESEND_API_KEY not set. Reset URL:", resetUrl);
  }

  return okJson({});
}
