/**
 * "2 short" when fewer sections are covered than expected, "1 over"
 * when more. Null when the counts match or nothing is expected.
 */
export function loadMismatchLabelOf(
  expected: number | null,
  covered: number,
): string | null {
  if (expected === null) return null;

  const shortfall = expected - covered;
  if (shortfall === 0) return null;

  return shortfall > 0 ? `${shortfall} short` : `${-shortfall} over`;
}
