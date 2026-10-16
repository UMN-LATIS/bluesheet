const MAX_FRINGE_RATE = 5;
const BASIS_POINTS_PER_UNIT = 10_000;
const BASIS_POINT_TOLERANCE = 1e-6;

export const formatPercent = (fraction: number) =>
  `${Number((fraction * 100).toFixed(2))}%`;

export type ParsedFringeRate = { fringeRate: number } | { refusal: string };

export function parseFringeRate(text: string): ParsedFringeRate {
  const percent = Number(text.replace(/[%\s]/g, ""));
  if (text.trim() === "" || !Number.isFinite(percent)) {
    return { refusal: "Enter a number." };
  }

  const fringeRate = percent / 100;
  if (fringeRate < 0 || fringeRate > MAX_FRINGE_RATE) {
    return { refusal: "Enter 0% to 500%." };
  }

  const basisPoints = fringeRate * BASIS_POINTS_PER_UNIT;
  if (Math.abs(basisPoints - Math.round(basisPoints)) > BASIS_POINT_TOLERANCE) {
    return { refusal: "Use at most two decimals." };
  }

  return { fringeRate: Math.round(basisPoints) / BASIS_POINTS_PER_UNIT };
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
