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
 * A null `startTermCode` becomes a year before the current
 * term, a null `endTermCode` a year after it. Returns null
 * when the user may not read the group's leaves.
 */
export async function fetchLeaveTimeline(
  groupId: T.Group["id"],
  startTermCode: number | null,
  endTermCode: number | null,
): Promise<T.LeaveTimeline | null> {
  const res = await axios.get<T.LeaveTimeline>(
    `/api/leave-planning/groups/${groupId}/leaves`,
    {
      params: { start: startTermCode, end: endTermCode },
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
  startTermCode: number,
  endTermCode: number,
): Promise<T.TeachingHistory> {
  const res = await axios.get<T.TeachingHistory>(
    `/api/leave-planning/groups/${groupId}/teaching-history`,
    { params: { start: startTermCode, end: endTermCode } },
  );

  return res.data;
}

export async function fetchLeavePermissions(
  leaveId: number,
): Promise<T.ApiResourceItemPermissions> {
  const res = await axios.get<T.ApiResourceItemPermissions>(
    `/api/permissions/leaves/${leaveId}`,
  );
  return res.data;
}

export async function fetchLeaveArtifacts(
  leaveId: number,
): Promise<T.LeaveArtifact[]> {
  const res = await axios.get<{ data: T.LeaveArtifact[] }>(
    `/api/leaves/${leaveId}/artifacts`,
  );
  return res.data.data;
}

export interface NewLeavePayload {
  emplid: number;
  description: string;
  start_date: string;
  end_date: string;
  status: T.LeaveStatus;
  type: T.LeaveType;
}

export type ExistingLeavePayload = Omit<NewLeavePayload, "emplid"> & {
  user_id: number;
};

export type ArtifactPayload = Pick<T.LeaveArtifact, "label" | "target">;

// Without this the axios interceptor raises the
// global error modal over the panel, and the panel's own
// message never gets read.
const WRITE_CONFIG: T.CustomAxiosRequestConfig = {
  skipErrorNotifications: true,
};

export async function createLeaveInGroup(
  groupId: T.Group["id"],
  payload: NewLeavePayload,
): Promise<T.PlanningLeave> {
  const res = await axios.post<T.PlanningLeave>(
    `/api/leave-planning/groups/${groupId}/leaves`,
    payload,
    WRITE_CONFIG,
  );
  return res.data;
}

export async function saveLeaveEdits(
  leaveId: number,
  payload: ExistingLeavePayload,
): Promise<void> {
  await axios.put(`/api/leaves/${leaveId}`, payload, WRITE_CONFIG);
}

export async function removeLeave(leaveId: number): Promise<void> {
  await axios.delete(`/api/leaves/${leaveId}`, WRITE_CONFIG);
}

export async function addArtifactToLeave(
  leaveId: number,
  payload: ArtifactPayload,
): Promise<void> {
  await axios.post(`/api/leaves/${leaveId}/artifacts`, payload, WRITE_CONFIG);
}

export async function saveArtifactEdits(
  leaveId: number,
  artifactId: number,
  payload: ArtifactPayload,
): Promise<void> {
  await axios.put(
    `/api/leaves/${leaveId}/artifacts/${artifactId}`,
    payload,
    WRITE_CONFIG,
  );
}

export async function removeArtifactFromLeave(
  leaveId: number,
  artifactId: number,
): Promise<void> {
  await axios.delete(
    `/api/leaves/${leaveId}/artifacts/${artifactId}`,
    WRITE_CONFIG,
  );
}
