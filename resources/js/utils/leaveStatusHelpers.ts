import { type Component } from "vue";
import { type LeaveStatus, leaveStatuses } from "@/types";
import { CircleCheckIcon, NoIcon, QuestionIcon, SparklesIcon } from "@/icons";

const leaveStatusToLabelMap: Record<LeaveStatus, string> = {
  [leaveStatuses.ELIGIBLE]: "Eligible",
  [leaveStatuses.PENDING]: "Pending",
  [leaveStatuses.CONFIRMED]: "Confirmed",
  [leaveStatuses.DEFERRED]: "Deferred",
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

const leaveStatusToColorMap: Record<LeaveStatus, string> = {
  [leaveStatuses.ELIGIBLE]: "blue-600",
  [leaveStatuses.PENDING]: "orange-600",
  [leaveStatuses.CONFIRMED]: "green-600",
  [leaveStatuses.DEFERRED]: "neutral-400",
};

/**
 * A Tailwind color fragment such as "blue-600", to interpolate
 * into a class. A shade outside the safelist in
 * tailwind.config.js is dropped from the built CSS.
 */
export function getLeaveStatusColor(status: LeaveStatus): string {
  return leaveStatusToColorMap[status] ?? "neutral-400";
}

const leaveStatusToIconMap: Record<LeaveStatus, Component> = {
  [leaveStatuses.ELIGIBLE]: SparklesIcon,
  [leaveStatuses.PENDING]: QuestionIcon,
  [leaveStatuses.CONFIRMED]: CircleCheckIcon,
  [leaveStatuses.DEFERRED]: NoIcon,
};

export function getLeaveStatusIcon(status: LeaveStatus): Component {
  return leaveStatusToIconMap[status] ?? NoIcon;
}
