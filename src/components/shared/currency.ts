// Currency + number formatting helpers, shared across summary views.

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Full currency, no cents. e.g. $1,234,567 */
export function formatUSD(value: number): string {
  return usd0.format(Math.round(value));
}

/** Compact currency for large figures. e.g. $1.42B, $845M */
export function formatUSDCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${Math.round(value)}`;
}

/** Plain integer with thousands separators. e.g. 18,500 */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}
