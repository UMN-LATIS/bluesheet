import type { SisTerm } from "../types";

/**
 * Nothing on this page reaches the SIS yet. When the save endpoints land this
 * becomes true and a term that has not started unlocks; a term that is under
 * way or over stays locked either way, since those change in the SIS.
 */
const CAN_SAVE_A_FUTURE_TERM: boolean = false;

/**
 * Read-only is a property of the term, so the page, the canvas, the sheet,
 * and the editor all resolve it from here rather than deciding for
 * themselves. Dates are "YYYY-MM-DD" strings, which sort the same way the
 * days do; a term the SIS sent without them is read-only, since we cannot
 * tell whether it has run.
 */
export function isTermReadOnly(term: SisTerm | null, today: string): boolean {
  if (!term) return true;

  const hasEnded = term.endDate !== null && term.endDate < today;
  const hasBegun = term.startDate !== null && term.startDate <= today;

  return hasEnded || hasBegun || !CAN_SAVE_A_FUTURE_TERM;
}
