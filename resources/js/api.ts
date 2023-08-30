import { axios } from "@/lib";
import {
  ApiUserLookupResponse,
  ApiUserResponse,
  UserLookupItem,
  User,
  Leave,
  NewLeave,
  TermCode,
  Course,
  Term,
  Group,
} from "@/types";

export async function lookupUsers(query: string): Promise<UserLookupItem[]> {
  const res = await axios.get<ApiUserLookupResponse>(
    `/api/autocompleter/user?searchType=nameAndInternetId&q=${query}`,
  );
  return res.data.items;
}

export async function getUser(userId: number): Promise<User> {
  const res = await axios.get<ApiUserResponse>(`/api/user/${userId}`);
  return res.data;
}

export async function updateUser(user: User) {
  const res = await axios.put<User>(`/api/user/${user.id}`, user);
  return res.data;
}

export async function createLeave(leave: NewLeave) {
  const res = await axios.post<Leave>(`/api/leaves`, leave);
  return res.data;
}

export async function updateLeave(leave: Leave) {
  const res = await axios.put<Leave>(`/api/leaves/${leave.id}`, leave);
  return res.data;
}

export async function deleteLeave(leaveId: number) {
  const res = await axios.delete(`/api/leaves/${leaveId}`);
  return res.data;
}

export async function getUserLeaves(userId: number): Promise<Leave[]> {
  const res = await axios.get<Leave[]>(`/api/users/${userId}/leaves`);
  return res.data;
}

export async function updateUserLeaves(userId: number, leaves: Leave[]) {
  const res = await axios.put<Leave[]>(`/api/users/${userId}/leaves`, {
    leaves,
  });
  return res.data;
}

let getTermsCache = [] as Term[];
export async function getTerms() {
  if (getTermsCache.length) {
    return getTermsCache;
  }
  const res = await axios.get<Term[]>(`/api/terms`);
  getTermsCache = res.data;
  return res.data;
}

type GroupId = number;
type TermId = number;
type GetGroupByTermCacheKey = `${GroupId}-${TermId}`;
const getGroupByTermCache: Map<GetGroupByTermCacheKey, Course[]> = new Map();
export async function getGroupCoursesByTerm({
  groupId,
  termId,
}: {
  groupId: number;
  termId: number;
}) {
  const cacheKey: GetGroupByTermCacheKey = `${groupId}-${termId}`;
  if (getGroupByTermCache.has(cacheKey)) {
    return getGroupByTermCache.get(cacheKey)!;
  }

  const res = await axios.get<Course[]>(
    `/api/terms/${termId}/groups/${groupId}/courses?includeRoles=PI`,
  );
  getGroupByTermCache.set(cacheKey, res.data);
  return res.data;
}

const getGroupCache: Map<GroupId, Group> = new Map();
export async function getGroup(groupId: number) {
  if (getGroupCache.has(groupId)) {
    return getGroupCache.get(groupId)!;
  }

  const res = await axios.get<Group>(`/api/group/${groupId}`);
  getGroupCache.set(groupId, res.data);
  return res.data;
}
