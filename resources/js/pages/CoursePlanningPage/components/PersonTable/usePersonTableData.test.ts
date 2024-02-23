import * as T from "@/types";
import { getTableRows, toSpreadsheetRow } from "./usePersonTableData";
import { createMockLookups } from "../../stores/createMockLookups";
import { first, keyBy, update } from "lodash";

describe("usePersonTableData", () => {
  it("gets person table rows", () => {
    const lookups = createMockLookups();
    const personTableData = getTableRows(lookups);
    expect(personTableData).toMatchSnapshot();
  });

  it("converts data to spreadsheet json format", () => {
    const rows = getTableRows(createMockLookups());

    expect(toSpreadsheetRow(rows[0])).toMatchInlineSnapshot(`
      {
        "Fall 2021": "AFRO-1009",
        "Spring 2022": "",
        "academicAppointment": "Faculty",
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);
  });

  it("filters for course level", () => {
    const lookups = createMockLookups();
    // change the course level of one of the courses
    lookups.courseLookup["AFRO-1009"].courseLevel = "GRD";

    const originalRows = getTableRows(lookups);

    // expect that we can find some rows with AFRO-1009
    expect(toSpreadsheetRow(originalRows[0])).toMatchInlineSnapshot(`
      {
        "Fall 2021": "AFRO-1009",
        "Spring 2022": "",
        "academicAppointment": "Faculty",
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);

    const filters = {
      excludedCourseLevels: new Set(["GRD"]),
    };

    const rows = getTableRows({
      ...lookups,
      filters,
    });

    // expect that AFRO-1009 is not in any spreadsheet row
    expect(JSON.stringify(rows)).not.toContain("AFRO-1009");
  });

  it("filters for course type", () => {
    const lookups = createMockLookups();
    lookups.courseLookup["AFRO-1009"].courseType = "DIS";

    const originalRows = getTableRows(lookups);
    expect(toSpreadsheetRow(originalRows[0])).toMatchInlineSnapshot(`
      {
        "Fall 2021": "AFRO-1009",
        "Spring 2022": "",
        "academicAppointment": "Faculty",
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);

    const filters = {
      excludedCourseTypes: new Set(["DIS"]),
    };

    const rows = getTableRows({
      ...lookups,
      filters,
    });

    expect(JSON.stringify(rows)).not.toContain("AFRO-1009");
  });

  it("filters for Employee Appointment", () => {
    const lookups = createMockLookups();
    lookups.personLookup[12346].academicAppointment = "Staff";

    const originalRows = getTableRows(lookups);
    expect(toSpreadsheetRow(originalRows[0])).toMatchInlineSnapshot(`
      {
        "Fall 2021": "AFRO-1009",
        "Spring 2022": "",
        "academicAppointment": "Staff",
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);

    const filters = {
      excludedAcadAppts: new Set(["Staff"]),
    };

    const rows = getTableRows({
      ...lookups,
      filters,
    });

    const firstEntry = toSpreadsheetRow(rows[0]);

    expect(firstEntry.givenName).not.toBe("Kate");
  });

  it("filters by term range", () => {
    const lookups = createMockLookups();
    const originalRows = getTableRows(lookups);
    expect(toSpreadsheetRow(originalRows[0])).toMatchInlineSnapshot(`
      {
        "Fall 2021": "AFRO-1009",
        "Spring 2022": "",
        "academicAppointment": "Faculty",
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);

    const filters = {
      // only Fall 2021
      startTermId: null,
      endTermId: 1,
    };

    const rows = getTableRows({
      ...lookups,
      filters,
    });

    expect(toSpreadsheetRow(rows[0])).toMatchInlineSnapshot(`
      {
        "Fall 2021": "AFRO-1009",
        "academicAppointment": "Faculty",
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);
  });

  it('excludes draft courses unless "Planning Mode" is enabled', () => {
    const lookups = createMockLookups();

    // add a draft section
    const plannedSection: T.CourseSection = {
      ...lookups.sectionLookup["AFRO-1011"],
      id: "db-555",
      dbId: 555,
      classNumber: null,
      courseId: "AFRO-1011",
      termId: 2,
      isPublished: false,
    };

    const enrollmentInPlannedSection: T.Enrollment = {
      id: "db-444",
      dbId: 444,
      sectionId: "db-555",
      emplid: 12346,
      role: "PI",
    };

    lookups.sectionLookup["db-555"] = plannedSection;
    lookups.enrollmentLookup["db-444"] = enrollmentInPlannedSection;

    const rows = getTableRows(lookups);
    expect(toSpreadsheetRow(rows[0])).toMatchInlineSnapshot(`
      {
        "Fall 2021": "AFRO-1009",
        "Spring 2022": "",
        "academicAppointment": "Faculty",
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);
  });

  it("excludes people with no enrollments", () => {
    const lookups = createMockLookups();
    const rows = getTableRows(lookups);

    expect(rows.length).toBe(2);

    const personToExclude = lookups.personLookup[12345];

    // remove all enrollments for '12345'
    const excludedEnrollments = Object.values(lookups.enrollmentLookup).filter(
      (enrollment) => enrollment.emplid !== personToExclude.emplid,
    );
    lookups.enrollmentLookup = keyBy(excludedEnrollments, "id");

    const updatedRows = getTableRows(lookups);
    expect(updatedRows.length).toBe(1);
    const firstEntry = toSpreadsheetRow(updatedRows[0]);
    expect(firstEntry.id).not.toBe(12345);
  });

  it("filters by enrolled role", () => {
    const lookups = createMockLookups();
    const rows = getTableRows(lookups);

    // change the role of one of the enrollments
    const firstEnrollment = Object.values(lookups.enrollmentLookup)[0];
    firstEnrollment.role = "TA";

    // before we set the filter, expect that this enrollment is in the table
    expect(JSON.stringify(rows)).toContain("TA");
    expect(JSON.stringify(rows)).toContain(firstEnrollment.id);

    // now set the filter to exclude TAs
    const filters = {
      excludedEnrollmentRoles: new Set<T.EnrollmentRole>(["TA"]),
    };

    const updatedRows = getTableRows({
      ...lookups,
      filters,
    });

    expect(JSON.stringify(updatedRows)).not.toContain("TA");
    expect(JSON.stringify(updatedRows)).not.toContain(firstEnrollment.id);
  });
});
