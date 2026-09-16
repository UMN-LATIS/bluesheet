import { leaveStatuses, leaveTypes } from "@/types";
import type { PlanningLeave, PlanningPerson } from "@/types";
import { getLeaveTypeLabel } from "@/utils/leaveTypeHelpers";

const ASSISTANT_PROFESSOR_JOB_CODE = "9403";

export const isEligibleWhenTenured = (
  leave: PlanningLeave,
  person: PlanningPerson | undefined,
): boolean =>
  leave.type === leaveTypes.SABBATICAL &&
  leave.status === leaveStatuses.ELIGIBLE &&
  (person?.jobCodes.includes(ASSISTANT_PROFESSOR_JOB_CODE) ?? false);

export const leaveBarLabelOf = (
  leave: PlanningLeave,
  person: PlanningPerson | undefined,
): string =>
  isEligibleWhenTenured(leave, person)
    ? `${getLeaveTypeLabel(leave.type)} · when tenured`
    : getLeaveTypeLabel(leave.type);
