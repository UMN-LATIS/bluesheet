import { leaveStatuses, leaveTypes } from "@/types";
import type { PlanningLeave, PlanningPerson } from "@/types";
import { getLeaveTypeLabel } from "@/utils/leaveTypeHelpers";

const ASSISTANT_PROFESSOR_JOB_CODE = "9403";

export function isEligibleWhenTenured(
  leave: PlanningLeave,
  person: PlanningPerson | undefined,
): boolean {
  if (!person) return false;

  return (
    leave.type === leaveTypes.SABBATICAL &&
    leave.status === leaveStatuses.ELIGIBLE &&
    person.jobCodes.includes(ASSISTANT_PROFESSOR_JOB_CODE)
  );
}

export const leaveBarLabelOf = (
  leave: PlanningLeave,
  person: PlanningPerson,
): string =>
  isEligibleWhenTenured(leave, person)
    ? `${getLeaveTypeLabel(leave.type)} · when tenured`
    : getLeaveTypeLabel(leave.type);
