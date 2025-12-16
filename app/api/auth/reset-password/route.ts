import bcrypt from "bcryptjs";
import { z } from "zod";

import { errorJson, okJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return errorJson({ status: 400, code: "INVALID_INPUT", message: "Invalid input" });
  }

  const { email, token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, email: true, expiresAt: true },
  });

  if (!record || record.email !== email || record.expiresAt.getTime() < Date.now()) {
    return errorJson({ status: 400, code: "INVALID_INPUT", message: "Invalid or expired token" });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.delete({ where: { token } });

  return okJson({});
}
