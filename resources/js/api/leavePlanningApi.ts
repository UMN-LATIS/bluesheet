import { axios } from "@/utils";
import * as T from "@/types";

export async function fetchSisTerms(): Promise<T.PlanningTerm[]> {
  const res = await axios.get<T.PlanningTerm[]>("/api/sis/terms");
  return res.data;
}

export async function fetchLeavePlanningGroups(): Promise<T.PlanningGroup[]> {
  const res = await axios.get<T.PlanningGroup[]>("/api/leave-planning/groups");
  return res.data;
}

/**
 * A null `startTermId` becomes a year before the current
 * term, a null `endTermId` a year after it. Returns null
 * when the user may not read the group's leaves.
 */
export async function fetchLeaveTimeline(
  groupId: T.Group["id"],
  startTermId: number | null,
  endTermId: number | null,
): Promise<T.LeaveTimeline | null> {
  const res = await axios.get<T.LeaveTimeline>(
    `/api/leave-planning/groups/${groupId}/leaves`,
    {
      params: { start: startTermId, end: endTermId },
      // Counting 403 as an answer keeps it out of the
      // error interceptor, which raises the global error
      // modal.
      validateStatus: (status) => status === 200 || status === 403,
    },
  );

  return res.status === 403 ? null : res.data;
}

export async function fetchTeachingHistory(
  groupId: T.Group["id"],
  startTermId: number,
  endTermId: number,
): Promise<T.TeachingHistory> {
  const res = await axios.get<T.TeachingHistory>(
    `/api/leave-planning/groups/${groupId}/teaching-history`,
    { params: { start: startTermId, end: endTermId } },
  );

  return res.data;
}
