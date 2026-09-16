import type { TermLeave } from "@/types";

/**
 * A leave with no emplid is left out: nothing on this page can match it to a
 * roster entry or to a section's instructors.
 */
export function leavesByEmplid(leaves: TermLeave[]): Map<number, TermLeave[]> {
  const leavesForEmplid = new Map<number, TermLeave[]>();

  for (const leave of leaves) {
    if (leave.emplid === null) continue;

    const found = leavesForEmplid.get(leave.emplid) ?? [];
    leavesForEmplid.set(leave.emplid, [...found, leave]);
  }

  return leavesForEmplid;
}
