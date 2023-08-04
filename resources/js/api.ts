import { axios } from "@/lib";
import { ApiUserLookupResponse, UserLookupItem } from "@/types";

export async function lookupUsers(query: string): Promise<UserLookupItem[]> {
  const res = await axios.get<ApiUserLookupResponse>(
    `/api/autocompleter/user?searchType=nameAndInternetId&q=${query}`,
  );
  return res.data.items;
}
