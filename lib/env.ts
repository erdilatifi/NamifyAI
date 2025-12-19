import { z } from "zod";

function emptyToUndefined(value: string | undefined) {
  return value === "" ? undefined : value;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  DATABASE_URL: z.string().min(1),

  AUTH_SECRET: z.string().min(32).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM: z.string().min(1).optional(),

  OPENAI_API_KEY: z.string().min(1).optional(),

  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRO_PRICE_ID: z.string().min(1).optional(),
});

const parsed = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: emptyToUndefined(process.env.AUTH_SECRET),
  NEXT_PUBLIC_APP_URL: emptyToUndefined(process.env.NEXT_PUBLIC_APP_URL),
  GOOGLE_CLIENT_ID: emptyToUndefined(process.env.GOOGLE_CLIENT_ID),
  GOOGLE_CLIENT_SECRET: emptyToUndefined(process.env.GOOGLE_CLIENT_SECRET),
  RESEND_API_KEY: emptyToUndefined(process.env.RESEND_API_KEY),
  RESEND_FROM: emptyToUndefined(process.env.RESEND_FROM),
  OPENAI_API_KEY: emptyToUndefined(process.env.OPENAI_API_KEY),
  STRIPE_SECRET_KEY: emptyToUndefined(process.env.STRIPE_SECRET_KEY),
  STRIPE_WEBHOOK_SECRET: emptyToUndefined(process.env.STRIPE_WEBHOOK_SECRET),
  STRIPE_PRO_PRICE_ID: emptyToUndefined(process.env.STRIPE_PRO_PRICE_ID),
});

export const env = {
  ...parsed,
  NEXT_PUBLIC_APP_URL:
    parsed.NEXT_PUBLIC_APP_URL ??
    (parsed.NODE_ENV === "production" ? undefined : "http://localhost:3000"),
} as const;
