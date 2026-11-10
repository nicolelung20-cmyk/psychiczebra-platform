export type StripeMode = "test" | "live";

/**
 * Preview and local environments default to Stripe test mode.
 * Production defaults to live mode; STRIPE_MODE can explicitly force test mode.
 */
export function getStripeMode(): StripeMode {
  const configured = process.env.STRIPE_MODE;
  if (configured === "test" || configured === "live") return configured;
  return process.env.VERCEL_ENV === "production" ? "live" : "test";
}

export function getStripeSecretKey(): string | undefined {
  return getStripeMode() === "test"
    ? process.env.STRIPE_SECRET_KEY_TEST
    : process.env.STRIPE_SECRET_KEY;
}

export function getStripeWebhookSecret(kind: "billing" | "product" = "billing"): string | undefined {
  const mode = getStripeMode();
  if (kind === "product") {
    return mode === "test"
      ? process.env.STRIPE_PRODUCT_WEBHOOK_SECRET_TEST
      : process.env.STRIPE_PRODUCT_WEBHOOK_SECRET;
  }
  return mode === "test"
    ? process.env.STRIPE_WEBHOOK_SECRET_TEST
    : process.env.STRIPE_WEBHOOK_SECRET;
}
