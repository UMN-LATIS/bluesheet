import { type LeaveType, leaveTypeLabels, leaveTypes } from "@/types";

export function getLeaveTypeLabel(type: LeaveType): string {
  return leaveTypeLabels[type] ?? "Unknown";
}

/**
 * The label, or null for the catch-all "other" type, whose label names nothing
 * a reader can act on.
 */
export function getSpecificLeaveTypeLabel(type: LeaveType): string | null {
  return type === leaveTypes.OTHER ? null : getLeaveTypeLabel(type);
}

export function getLeaveTypeOptions(): {
  value: LeaveType;
  text: string;
}[] {
  return Object.entries(leaveTypeLabels).map(([value, text]) => ({
    value: value as LeaveType,
    text,
  }));
}
