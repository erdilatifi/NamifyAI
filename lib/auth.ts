import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    debugLogs: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    cookiePrefix: "namifyai",
  },
});
