import { leaveStatuses, type TermLeave } from "@/types";

const statusesByCertainty = [
  leaveStatuses.CONFIRMED,
  leaveStatuses.PENDING,
  leaveStatuses.ELIGIBLE,
] as const;

/**
 * Which of a person's leaves a single chip speaks for: the most certain one.
 * Null when they have no leave in the term.
 */
export function mostCertainLeaveStatus(
  leaves: TermLeave[],
): TermLeave["status"] | null {
  return (
    statusesByCertainty.find((status) =>
      leaves.some((leave) => leave.status === status),
    ) ?? null
  );
}
