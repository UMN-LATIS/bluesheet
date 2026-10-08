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

/**
 * A null `value` drops this fiscal year's value, so an
 * earlier year's or the default applies.
 */
export async function saveCostSetting(
  groupId: T.Group["id"],
  termCode: number,
  key: string,
  value: T.CostSettingValue | null,
): Promise<T.CostSetting> {
  const res = await axios.put<T.CostSetting>(
    `/api/term-planning/groups/${groupId}/cost-settings/${key}`,
    { value },
    { ...WRITE_CONFIG, params: { term: termCode } },
  );
  return res.data;
}
