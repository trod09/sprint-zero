import type { IndustryKey } from "@/core/case-engine";

/** How each generated-case industry is written in `company.industry`. */
export const INDUSTRY_LABEL: Record<IndustryKey, string> = {
  fintech: "Fintech",
  marketplace: "Marketplace",
  saas: "SaaS B2B",
  consumer: "Consumer",
};
