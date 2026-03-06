import { type LeaveType, leaveTypeLabels } from "@/types";

export function getLeaveTypeLabel(type: LeaveType): string {
  return leaveTypeLabels[type] ?? "Unknown";
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
