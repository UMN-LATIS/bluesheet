import { useQuery } from "@tanstack/vue-query";
import { axios } from "@/utils";
import type { SisTerm } from "../types";

export function useSisTermsQuery() {
  return useQuery({
    queryKey: ["sis", "terms"],
    queryFn: async (): Promise<SisTerm[]> => {
      const res = await axios.get<SisTerm[]>("/api/sis/terms");
      return res.data;
    },
  });
}
