import type { TermLeave } from "@/types";

/**
 * A leave with no emplid is left out: nothing on this page can match it to a
 * roster entry or to a section's instructors.
 */
export function emplidsOnLeave(leaves: TermLeave[]): Set<number> {
  return new Set(
    leaves
      .map((leave) => leave.emplid)
      .filter((emplid): emplid is number => emplid !== null),
  );
}
