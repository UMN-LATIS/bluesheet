const MAX_HOURS = 2080;

/**
 * Null when the server would accept `hours` as a grad
 * appointment's hours for a term, else the reason it would
 * refuse it.
 */
export function refusalOfHours(hours: number): string | null {
  if (!Number.isFinite(hours)) return "Enter a number.";
  if (!Number.isInteger(hours)) return "Use whole hours.";
  if (hours < 0 || hours > MAX_HOURS) return `Enter 0 to ${MAX_HOURS} hours.`;

  return null;
}

/**
 * Null when the server would accept `percent` as a grad
 * student's appointment on one section, else the reason it
 * would refuse it.
 */
export function refusalOfAppointmentPercent(percent: number): string | null {
  if (!Number.isFinite(percent)) return "Enter a number.";
  if (percent < 0 || percent > 100) return "Enter 0 to 100%.";

  return null;
}
