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

/** A null cost restores Nova's rate for the term. */
export async function saveJobCodeRateOverride(
  groupId: T.Group["id"],
  termCode: number,
  jobCode: string,
  costPerCourse: number | null,
): Promise<void> {
  await axios.put(
    `/api/term-planning/groups/${groupId}/cost-rate-overrides/job-codes/${encodeURIComponent(jobCode)}`,
    { costPerCourse },
    { ...WRITE_CONFIG, params: { term: termCode } },
  );
}

/** A null cost restores Nova's rate for the term. */
export async function saveTaRateOverride(
  groupId: T.Group["id"],
  termCode: number,
  appointmentPercent: number,
  studentStatus: T.StudentStatus,
  costPerTerm: number | null,
): Promise<void> {
  await axios.put(
    `/api/term-planning/groups/${groupId}/cost-rate-overrides/ta-appointments/${appointmentPercent}/${studentStatus}`,
    { costPerTerm },
    { ...WRITE_CONFIG, params: { term: termCode } },
  );
}

/** A null amount restores the person's rate. */
export async function savePersonRateOverride(
  groupId: T.Group["id"],
  termCode: number,
  emplid: number,
  amount: number | null,
): Promise<void> {
  await axios.put(
    `/api/term-planning/groups/${groupId}/cost-rate-overrides/people/${emplid}`,
    { amount },
    { ...WRITE_CONFIG, params: { term: termCode } },
  );
}

/** A null amount restores the rate. */
export async function saveCostLineOverride(
  groupId: T.Group["id"],
  termCode: number,
  override: Omit<T.CostLineOverride, "amount"> & { amount: number | null },
): Promise<void> {
  await axios.put(
    `/api/term-planning/groups/${groupId}/cost-line-overrides`,
    override,
    { ...WRITE_CONFIG, params: { term: termCode } },
  );
}
