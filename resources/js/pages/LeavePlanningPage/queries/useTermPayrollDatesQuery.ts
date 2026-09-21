import { useQuery } from "@tanstack/vue-query";
import { getTermPayrollDates } from "@/api";

export function useTermPayrollDatesQuery() {
  return useQuery({
    queryKey: ["termPayrollDates"],
    queryFn: getTermPayrollDates,
  });
}
