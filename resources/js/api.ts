import { axios } from "@/lib";
import {
  ApiUserLookupResponse,
  ApiUserResponse,
  UserLookupItem,
  User,
  Leave,
  NewLeave,
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

export async function createLeave(leave: NewLeave) {
  const res = await axios.post<Leave>(`/api/leaves`, leave);
  return res.data;
}

export async function updateLeave(leave: Leave) {
  const res = await axios.put<Leave>(`/api/leaves/${leave.id}`, leave);
  return res.data;
}
