import Stripe from "stripe";

import { env } from "@/lib/env";

export function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(env.STRIPE_SECRET_KEY);
}
