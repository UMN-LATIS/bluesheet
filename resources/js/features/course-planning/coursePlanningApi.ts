import { axios } from "@/utils";
import * as T from "./coursePlanningTypes";

export async function getGroup(groupId: number) {
  const res = await axios.get<T.ApiGetGroupCoursePlanningResponse>(
    `/api/course-planning/groups/${groupId}`,
  );
  return res.data;
}
