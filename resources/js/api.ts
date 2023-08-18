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

export async function getTerms() {
  const res = await axios.get<Term[]>(`/api/terms`);
  return res.data;
}

export async function getGroupCoursesByTerm({
  groupId,
  termCode,
  year,
}: {
  groupId: number;
  termCode: TermCode;
  year: number;
}) {
  const res = await axios.get<Course[]>(
    `/api/terms/${year}/${termCode}/groups/${groupId}/courses?filters=excludeNullInstructors`,
  );
  return res.data;
}

export async function getGroup(groupId: number) {
  const res = await axios.get<Group>(`/api/group/${groupId}`);
  return res.data;
}
