import type { CostSettingType } from "@/types";

const MAX_DOLLARS = 99_999_999.99;
const MAX_ANNUAL_LOAD = 40;

const hasAtMostTwoDecimals = (value: number) =>
  Math.round(value * 100) === value * 100;

/**
 * Null when the server would accept `value` for a setting
 * of `type`, else the reason it would refuse it. Mirrors
 * CostSettingType::rules() on the server.
 */
export function refusalOfSettingValue(
  type: Exclude<CostSettingType, "toggle">,
  value: number,
): string | null {
  switch (type) {
    case "money":
      if (value < 0 || value > MAX_DOLLARS) return "Enter $0 to $99,999,999.99.";
      return hasAtMostTwoDecimals(value) ? null : "Use whole cents.";

    case "percent":
      if (value <= 0 || value > 100) return "Enter more than 0% and at most 100%.";
      return hasAtMostTwoDecimals(value) ? null : "Use at most two decimals.";

    case "count":
      return Number.isInteger(value) && value >= 0 && value <= MAX_ANNUAL_LOAD
        ? null
        : `Enter a whole number from 0 to ${MAX_ANNUAL_LOAD}.`;
  }
}
