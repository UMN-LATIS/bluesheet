import * as T from "@/types";
import { getPersonTableRows } from "./getPersonTableRows";
import { toPersonSpreadsheetRowRecord } from "./toPersonSpreadsheetRowRecord";

export function getPersonSpreadsheetRecords({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters: T.CoursePlanningFilters;
}) {
  return getPersonTableRows({
    lookups,
    filters,
  }).map(toPersonSpreadsheetRowRecord);
}
