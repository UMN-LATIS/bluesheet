import { axios } from "@/utils";
import * as T from "@/types";

const WRITE_CONFIG: T.CustomAxiosRequestConfig = {
  skipErrorNotifications: true,
};

/** Null when the group has no department to cost. */
export async function fetchCostAssumptions(
  groupId: T.Group["id"],
  termCode: number,
): Promise<T.CostAssumptions | null> {
  const res = await axios.get<T.CostAssumptions>(
    `/api/term-planning/groups/${groupId}/cost-assumptions`,
    {
      params: { term: termCode },
      // Counting 404 as an answer keeps it out of the
      // error interceptor, which raises the global error
      // modal.
      validateStatus: (status) => status === 200 || status === 404,
    },
  );

  return res.status === 404 ? null : res.data;
}

export async function fetchEnrollmentHistory(
  groupId: T.Group["id"],
  termCode: number,
): Promise<T.EnrollmentHistory> {
  const res = await axios.get<T.EnrollmentHistory>(
    `/api/term-planning/groups/${groupId}/enrollment-history`,
    { params: { term: termCode } },
  );
  return res.data;
}

/** A null value restores Nova's value for the term. */
export async function saveJobCodeRateOverride(
  groupId: T.Group["id"],
  termCode: number,
  jobCode: string,
  change: { salary: number | null } | { fringeRate: number | null },
): Promise<void> {
  await axios.patch(
    `/api/term-planning/groups/${groupId}/cost-rate-overrides/job-codes/${encodeURIComponent(jobCode)}`,
    change,
    { ...WRITE_CONFIG, params: { term: termCode } },
  );
}

/** A null salary restores the job code's rate. */
export async function savePersonRateOverride(
  groupId: T.Group["id"],
  termCode: number,
  emplid: number,
  salary: number | null,
): Promise<void> {
  await axios.put(
    `/api/term-planning/groups/${groupId}/cost-rate-overrides/people/${emplid}`,
    { salary },
    { ...WRITE_CONFIG, params: { term: termCode } },
  );
}

/** Null or blank notes delete the note. */
export async function savePersonNote(
  groupId: T.Group["id"],
  termCode: number,
  emplid: number,
  notes: string | null,
): Promise<void> {
  await axios.put(
    `/api/term-planning/groups/${groupId}/person-notes/${emplid}`,
    { notes },
    { ...WRITE_CONFIG, params: { term: termCode } },
  );
}
