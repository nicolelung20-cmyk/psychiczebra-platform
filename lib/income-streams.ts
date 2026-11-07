export const incomeStreamCatalog = {
  "growth-audit": { env: "STRIPE_PRICE_GROWTH_AUDIT", mode: "payment", product: "prod_VGAzzY41qexYBR", name: "Growth Audit" },
  "sales-accelerator": { env: "STRIPE_PRICE_SALES_ACCELERATOR", mode: "payment", product: "prod_VGB0zjOJxdUeW2", name: "Sales Accelorator" },
  "marketing-accelerator": { env: "STRIPE_PRICE_MARKETING_ACCELERATOR", mode: "subscription", product: "prod_VGB1C5SU0xSQLa", name: "Marketing Accelerator" },
  "ai-automation": { env: "STRIPE_PRICE_AI_AUTOMATION", mode: "subscription", product: "prod_VGB1wbiOM4gvOf", name: "AI Automation" },
  "elevat-pro": { env: "STRIPE_PRICE_ELEVAT_PRO", mode: "subscription", product: "prod_VHCWmjtgvjloQh", name: "Elevat Pro" },
} as const;

export type IncomeStream = keyof typeof incomeStreamCatalog;
export type BillingMode = "test" | "live";

export function resolveIncomeStream(stream: unknown): IncomeStream {
  if (typeof stream === "string" && Object.hasOwn(incomeStreamCatalog, stream)) return stream as IncomeStream;
  return "elevat-pro";
}

export function resolvePriceId(stream: IncomeStream, billingMode: BillingMode = "live") {
  const config = incomeStreamCatalog[stream];
  if (billingMode === "test") {
    // Never fall back to a live price in a test-mode deployment.
    return process.env[`${config.env}_TEST`] ?? (stream === "elevat-pro" ? process.env.STRIPE_PRICE_ID_TEST : undefined);
  }
  return process.env[config.env] ?? (stream === "elevat-pro" ? process.env.STRIPE_PRICE_ID : undefined);
}

export function resolveProductId(stream: IncomeStream, billingMode: BillingMode = "live") {
  const config = incomeStreamCatalog[stream];
  if (billingMode === "test") {
    const envName = `STRIPE_PRODUCT_${stream.toUpperCase().replaceAll("-", "_")}_TEST`;
    // Test product IDs must be configured explicitly; live IDs are never reused.
    return process.env[envName];
  }
  return config.product;
}
