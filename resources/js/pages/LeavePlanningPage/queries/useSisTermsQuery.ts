import { useQuery } from "@tanstack/vue-query";
import { fetchSisTerms } from "@/api";

export function useSisTermsQuery() {
  return useQuery({
    queryKey: ["sis", "terms"],
    queryFn: fetchSisTerms,
  });
}
