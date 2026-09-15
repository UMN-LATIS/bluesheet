import type { TermLeave } from "@/types";

/**
 * A leave with no emplid is left out: nothing on this page can match it to a
 * roster entry or to a section's instructors.
 */
export function leavesByEmplid(leaves: TermLeave[]): Map<number, TermLeave[]> {
  const byEmplid = new Map<number, TermLeave[]>();

  for (const leave of leaves) {
    if (leave.emplid === null) continue;

    byEmplid.set(leave.emplid, [...(byEmplid.get(leave.emplid) ?? []), leave]);
  }

  return byEmplid;
}
