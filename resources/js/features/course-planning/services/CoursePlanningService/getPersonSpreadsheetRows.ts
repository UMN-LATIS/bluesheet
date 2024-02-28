import * as T from "@/types";
import { capitalize } from "vue";
import { getPersonTableRows } from "./getPersonTableRows";

export function toSpreadsheetRow(row: T.PersonTableRow) {
  const [person, ...termRecords] = row;

  return {
    id: person.emplid,
    surName: person.surName,
    givenName: person.givenName,
    academicAppointment: person.academicAppointment,
    ...termRecords.reduce((acc, termRecord) => {
      return {
        ...acc,
        [termRecord.term.name]: [
          ...termRecord.leaves.map((leave) =>
            capitalize(`${leave.type} Leave (${leave.status})`),
          ),
          ...termRecord.enrollments.map((enrollment) => enrollment.course.id),
        ].join(", "),
      };
    }, {}),
  };
}

export function getPersonSpreadsheetRows({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters?: T.CoursePlanningFilters;
}) {
  const rows = getPersonTableRows({
    lookups,
    filters,
  });

  return rows.map(toSpreadsheetRow);
}
