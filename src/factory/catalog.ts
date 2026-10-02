import { readFileSync } from "node:fs";

export type FactoryAsset = {
  repo: string;
  class: "product" | "agent" | "research";
  purpose: string;
  revenuePath: string;
  risk: "low" | "review";
};

export const FACTORY_ASSETS: FactoryAsset[] = [
  { repo: "psychiczebra-platform", class: "product", purpose: "Elevat core workspace", revenuePath: "lead -> checkout -> subscription", risk: "low" },
  { repo: "eve-chat-template", class: "product", purpose: "chat product substrate", revenuePath: "free -> paid chat", risk: "low" },
  { repo: "1eve-chat-template", class: "product", purpose: "alternate chat substrate", revenuePath: "free -> paid chat", risk: "low" },
  { repo: "high-yield-extensions", class: "product", purpose: "browser product experiments", revenuePath: "extension -> paid tier", risk: "review" },
  { repo: "skills", class: "agent", purpose: "reusable skills", revenuePath: "internal leverage -> product delivery", risk: "low" },
  { repo: "mini-swe-agent", class: "agent", purpose: "coding automation substrate", revenuePath: "delivery automation -> product velocity", risk: "low" },
  { repo: "my-project", class: "agent", purpose: "tool-calling experiments", revenuePath: "agent features -> paid workspace", risk: "low" },
  { repo: "awesome-grok", class: "agent", purpose: "operations dashboard prototype", revenuePath: "operations leverage", risk: "low" },
  { repo: "supergrok", class: "research", purpose: "quant research and paper trading", revenuePath: "research only", risk: "review" },
  { repo: "money", class: "research", purpose: "financial automation research", revenuePath: "research only", risk: "review" }
];

export function factorySummary() {
  const counts = FACTORY_ASSETS.reduce<Record<string, number>>((acc, item) => {
    acc[item.class] = (acc[item.class] ?? 0) + 1;
    return acc;
  }, {});
  return { total: FACTORY_ASSETS.length, counts, generatedAt: new Date().toISOString() };
}
