import * as T from "@/types";
import { capitalize } from "vue";

export function toPersonSpreadsheetRowRecord(
  row: T.PersonTableRow,
): T.PersonSpreadsheetRowRecord {
  const [person, ...termRecords] = row;

  return {
    id: String(person.emplid),
    surName: person.surName,
    givenName: person.givenName,
    academicAppointments: person.academicAppointments.join(", "),
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
