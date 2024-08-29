import { type LeaveStatus, leaveStatuses } from "@/types";

const leaveStatusToLabelMap: Record<LeaveStatus, string> = {
  [leaveStatuses.ELIGIBLE]: "Eligible",
  [leaveStatuses.PENDING]: "Pending",
  [leaveStatuses.CONFIRMED]: "Confirmed",
  [leaveStatuses.CANCELLED]: "Deferred",
};

/**
 * convert the db leave status to a human readable label
 */
export function getLeaveStatusLabel(status: LeaveStatus): string {
  return leaveStatusToLabelMap[status] ?? "Unknown";
}

export function getLeaveStatusOptions(): {
  value: LeaveStatus;
  text: string;
}[] {
  return Object.entries(leaveStatusToLabelMap).map(([value, text]) => ({
    value: value as LeaveStatus,
    text,
  }));
}
