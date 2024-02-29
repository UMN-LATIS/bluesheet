import * as T from "@/types";
import { getListOfTermLeaves } from "./getListOfTermLeaves";
import { getCourseTableRows } from "./getCourseTableRows";
import { toCourseSpreadsheetRowRecord } from "./toCourseSpreadsheetRowRecord";
import { capitalize } from "lodash";

export function getCourseSpreadsheetRecords({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters: T.CoursePlanningFilters;
}) {
  const termLeaves = getListOfTermLeaves({
    lookups,
    filters,
  });

  const leavesRecord: T.CourseSpreadsheetRowRecord = {
    id: "leaves",
    title: "Leaves",
    courseLevel: "-",
    courseType: "-",
    ...termLeaves.reduce((acc, { term, leaves }) => {
      return {
        ...acc,
        [term.name]: leaves
          .map(
            (leave) =>
              `${leave.person.displayName} (${
                leave.person.emplid
              }) - ${capitalize(leave.type)} Leave`,
          )
          .join(", "),
      };
    }, {}),
  };

  const courseRecords: T.CourseSpreadsheetRowRecord[] = getCourseTableRows({
    lookups,
    filters,
  }).map(toCourseSpreadsheetRowRecord);

  return [leavesRecord, ...courseRecords];
}
