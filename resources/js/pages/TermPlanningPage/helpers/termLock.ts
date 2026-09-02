import type { SisTerm } from "../types";

/**
 * Why a term cannot be edited. Read-only is a property of the term, so the
 * page, the canvas, the sheet, and the editor all resolve it from here rather
 * than deciding for themselves.
 */
export interface TermLock {
  /** The cause, named where the lock is: "Fall 2025 is closed." */
  headline: string;
  /** What it means for the reader: "Everything here is historical." */
  detail: string;
}

/**
 * Nothing on this page reaches the SIS yet. When the save endpoints land this
 * becomes true and a term that has not started unlocks; a term that is under
 * way or over stays locked either way, since those change in the SIS.
 */
const CAN_SAVE_A_FUTURE_TERM: boolean = false;

/**
 * Null only for a term a scheduler may edit. Dates are "YYYY-MM-DD" strings,
 * which sort the same way the days do.
 */
export function lockOfTerm(
  term: SisTerm | null,
  today: string,
): TermLock | null {
  if (!term) return notShippedYet("This term");

  if (term.endDate !== null && term.endDate < today) {
    return {
      headline: `${term.name} is closed.`,
      detail: "Everything here is historical.",
    };
  }

  if (term.startDate !== null && term.startDate <= today) {
    return {
      headline: `${term.name} is under way.`,
      detail: "Changes to a live term happen in the SIS.",
    };
  }

  return CAN_SAVE_A_FUTURE_TERM ? null : notShippedYet(term.name);
}

// Never "you do not have permission": the term is what is closed, not the person.
const notShippedYet = (termName: string): TermLock => ({
  headline: "Editing isn’t switched on yet.",
  detail: `${termName} is view-only for now.`,
});
