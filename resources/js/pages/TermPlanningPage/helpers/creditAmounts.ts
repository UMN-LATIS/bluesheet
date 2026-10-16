const MAX_CREDITS = 40;

/**
 * Null when the server would accept `credits` as the credits
 * a grad instructor teaches in a term, else the reason it
 * would refuse it.
 */
export function refusalOfCredits(credits: number): string | null {
  if (!Number.isFinite(credits)) return "Enter a number.";
  if (!Number.isInteger(credits)) return "Use whole credits.";
  if (credits < 0 || credits > MAX_CREDITS) {
    return `Enter 0 to ${MAX_CREDITS} credits.`;
  }

  return null;
}
