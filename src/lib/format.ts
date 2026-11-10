/**
 * Number formatting shared by server and client. The locale is fixed so the
 * server render and the browser render always produce the same text.
 */
const LOCALE = "en-US";

const integer = new Intl.NumberFormat(LOCALE);
const compact = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const usd = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usdCompact = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatInteger = (value: number) => integer.format(value);
export const formatCompact = (value: number) => compact.format(value);
export const formatUsd = (value: number) => usd.format(value);
export const formatUsdCompact = (value: number) => usdCompact.format(value);
