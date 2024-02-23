import { getTableRows, toSpreadsheetRow } from "./usePersonTableData";
import { createMockLookups } from "../../stores/createMockLookups";

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
    expect(toSpreadsheetRow(rows[0])).toMatchInlineSnapshot(`
      {
        "Fall 2021": "",
        "Spring 2022": "",
        "academicAppointment": "Faculty",
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);
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

    expect(toSpreadsheetRow(rows[0])).toMatchInlineSnapshot(`
      {
        "Fall 2021": "",
        "Spring 2022": "",
        "academicAppointment": "Faculty",
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);
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
      // only Spring 2022
      startTermId: 2,
      endTermId: null,
    };

    const rows = getTableRows({
      ...lookups,
      filters,
    });

    expect(toSpreadsheetRow(rows[0])).toMatchInlineSnapshot(`
      {
        "Spring 2022": "",
        "academicAppointment": "Faculty",
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);
  });
});
