export const incomeStreamCatalog = {
  "growth-audit": { env: "STRIPE_PRICE_GROWTH_AUDIT", mode: "payment", product: "prod_VGAzzY41qexYBR", name: "Growth Audit" },
  "sales-accelerator": { env: "STRIPE_PRICE_SALES_ACCELERATOR", mode: "payment", product: "prod_VGB0zjOJxdUeW2", name: "Sales Accelorator" },
  "marketing-accelerator": { env: "STRIPE_PRICE_MARKETING_ACCELERATOR", mode: "subscription", product: "prod_VGB1C5SU0xSQLa", name: "Marketing Accelerator" },
  "ai-automation": { env: "STRIPE_PRICE_AI_AUTOMATION", mode: "subscription", product: "prod_VGB1wbiOM4gvOf", name: "AI Automation" },
  "elevat-pro": { env: "STRIPE_PRICE_ELEVAT_PRO", mode: "subscription", product: "prod_VHCWmjtgvjloQh", name: "Elevat Pro" },
} as const;

export type IncomeStream = keyof typeof incomeStreamCatalog;

export function resolveIncomeStream(stream: unknown): IncomeStream {
  if (typeof stream === "string" && stream in incomeStreamCatalog) return stream as IncomeStream;
  return "elevat-pro";
}

export function resolvePriceId(stream: IncomeStream) {
  const config = incomeStreamCatalog[stream];
  return process.env[config.env] ?? (stream === "elevat-pro" ? process.env.STRIPE_PRICE_ID : undefined);
}
