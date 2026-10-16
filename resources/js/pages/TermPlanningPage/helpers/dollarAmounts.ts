const MAX_DOLLARS = 99_999_999.99;

/**
 * Null when the server would accept `dollars` as a cost,
 * else the reason it would refuse it.
 */
export function refusalOfDollars(dollars: number): string | null {
  if (!Number.isFinite(dollars)) return "Enter a number.";
  if (dollars < 0 || dollars > MAX_DOLLARS)
    return "Enter $0 to $99,999,999.99.";

  const isWholeCents = Number(dollars.toFixed(2)) === dollars;
  if (!isWholeCents) return "Use whole cents.";

  return null;
}
