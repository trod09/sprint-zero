/**
 * Number formatting for estimation cases. Fixed locale, so the server and the
 * browser render the same text.
 */
import type { Fact } from "./schema";

const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Factor a fact contributes to a product: a share in % counts as a fraction. */
export const factFactor = (fact: Pick<Fact, "value" | "unit">) =>
  fact.unit === "%" ? fact.value / 100 : fact.value;

/** A number for people: whole above 100, up to two decimals below. */
export const formatAmount = (value: number) =>
  Math.abs(value) >= 100 ? whole.format(value) : decimal.format(value);

export function formatFact(fact: Pick<Fact, "value" | "unit">): string {
  if (fact.unit === "%") return `${decimal.format(fact.value)}%`;
  if (fact.unit === "USD") return `$${formatAmount(fact.value)}`;
  return `${formatAmount(fact.value)} ${fact.unit}`;
}

/** Reads what a learner typed: "8,000,000", "8 000 000" or "8e6". */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[,\s_$]/g, "");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** "2.3x higher than" or "1.5x lower than", for a ratio to the answer. */
export function describeRatio(ratio: number): string {
  if (ratio >= 1) return `${decimal.format(ratio)}x higher than`;
  return `${decimal.format(1 / ratio)}x lower than`;
}
