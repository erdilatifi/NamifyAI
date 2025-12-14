import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const email = parsed.data.email;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  // Always return 200 to avoid user enumeration.
  if (!user) {
    return NextResponse.json({ ok: true });
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

  return NextResponse.json({ ok: true });
}
