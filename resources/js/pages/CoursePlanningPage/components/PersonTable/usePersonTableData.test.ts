import * as T from "@/types";
import { getTableRows, toSpreadsheetRow } from "./usePersonTableData";

const termLookup: Record<T.Term["id"], T.Term> = {
  1: {
    id: 1,
    name: "Fall 2021",
    startDate: "2021-08-01",
    endDate: "2021-12-31",
  },
  2: {
    id: 2,
    name: "Spring 2022",
    startDate: "2022-01-01",
    endDate: "2022-05-31",
  },
};

const personLookup: Record<T.Person["emplid"], T.Person> = {
  12345: {
    id: 210,
    givenName: "Dade",
    surName: "Murphy",
    displayName: "Dade Murphy",
    email: "dmurphy1234@umn.edu",
    title: "Associate Professor",
    jobCode: "9402",
    leaveIds: [1, 2],
    academicAppointment: "Faculty",
    emplid: 12345,
    sslEligible: true,
    midcareerEligible: false,
    sslApplyEligible: true,
  },
  12346: {
    id: 211,
    givenName: "Kate",
    surName: "Libby",
    displayName: "Kate Libby",
    email: "klibby@umn.edu",
    title: "Assistant Professor",
    jobCode: "9401",
    leaveIds: [],
    academicAppointment: "Faculty",
    emplid: 12346,
    sslEligible: true,
    midcareerEligible: false,
    sslApplyEligible: true,
  },
};

const courseLookup: Record<T.Course["id"], T.Course> = {
  "AFRO-1009": {
    id: "AFRO-1009",
    subject: "AFRO",
    catalogNumber: "1009",
    title: "History of Women in Africa",
    courseType: "LEC",
    courseLevel: "UGRD",
    courseCode: "AFRO-1009",
    source: "sis",
  },
  "AFRO-1011": {
    id: "AFRO-1011",
    subject: "AFRO",
    catalogNumber: "1011",
    title: "Advanced Topics in African History",
    courseType: "LEC",
    courseLevel: "UGRD",
    courseCode: "AFRO-1011",
    source: "sis",
  },
};

const sectionLookup: Record<T.CourseSection["id"], T.CourseSection> = {
  "sis-39": {
    id: "sis-39",
    classNumber: 39,
    dbId: null,
    courseId: "AFRO-1009",
    termId: 1,
    groupId: 1,
    classSection: "001",
    enrollmentCap: 18,
    enrollmentTotal: 16,
    waitlistCap: 0,
    waitlistTotal: 0,
    isPublished: false,
    isCancelled: false,
  },
  "sis-40": {
    id: "sis-40",
    classNumber: 40,
    dbId: null,
    courseId: "AFRO-1011",
    termId: 1,
    groupId: 1,
    classSection: "001",
    enrollmentCap: 18,
    enrollmentTotal: 16,
    waitlistCap: 0,
    waitlistTotal: 0,
    isPublished: false,
    isCancelled: false,
  },
};

const enrollmentLookup: Record<T.Enrollment["id"], T.Enrollment> = {
  "sis-sis-39-12345": {
    id: "sis-sis-39-12345",
    dbId: null,
    emplid: 12345,
    sectionId: "sis-39",
    role: "PI",
  },
  "sis-sis-40-12345": {
    id: "sis-sis-40-12345",
    dbId: null,
    emplid: 12345,
    sectionId: "sis-40",
    role: "PI",
  },
  "sis-sis-39-12346": {
    id: "sis-sis-39-12346",
    dbId: null,
    emplid: 12346,
    sectionId: "sis-39",
    role: "PI",
  },
};

const leaveLookup: Record<T.Leave["id"], T.Leave> = {
  1: {
    id: 1,
    user_id: 210,
    termIds: [1],
    type: T.leaveTypes.SABBATICAL,
    status: T.leaveStatuses.CONFIRMED,
    description: "Sabbatical",
    start_date: "2021-08-01",
    end_date: "2021-12-31",
    created_at: "2021-08-01",
    updated_at: "2021-08-01",
  },
  2: {
    id: 2,
    user_id: 210,
    termIds: [2],
    type: T.leaveTypes.SABBATICAL,
    status: T.leaveStatuses.CONFIRMED,
    description: "Sabbatical",
    start_date: "2022-01-01",
    end_date: "2022-05-31",
    created_at: "2022-01-01",
    updated_at: "2022-01-01",
  },
};

const lookups = {
  personLookup,
  termLookup,
  courseLookup,
  sectionLookup,
  enrollmentLookup,
  leaveLookup,
};

describe("usePersonTableData", () => {
  it("gets person table rows", () => {
    const personTableData = getTableRows(lookups);

    expect(personTableData).toMatchSnapshot();
  });

  it("converts data to spreadsheet json format", () => {
    const rows = getTableRows({
      personLookup,
      termLookup,
      courseLookup,
      sectionLookup,
      enrollmentLookup,
      leaveLookup,
    });

    expect(toSpreadsheetRow(rows[0])).toMatchInlineSnapshot(`
      {
        "Fall 2021": "AFRO-1009",
        "Spring 2022": "",
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);
  });

  it("filters for course level", () => {
    // change the course level of one of the courses
    courseLookup["AFRO-1009"].courseLevel = "GRD";

    const originalRows = getTableRows(lookups);

    // expect that we can find some rows with AFRO-1009
    expect(toSpreadsheetRow(originalRows[0])).toMatchInlineSnapshot(`
      {
        "Fall 2021": "AFRO-1009",
        "Spring 2022": "",
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
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);
  });

  it("filters for course type", () => {
    courseLookup["AFRO-1009"].courseType = "DIS";

    const originalRows = getTableRows(lookups);
    expect(toSpreadsheetRow(originalRows[0])).toMatchInlineSnapshot(`
      {
        "Fall 2021": "AFRO-1009",
        "Spring 2022": "",
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
        "givenName": "Kate",
        "id": 12346,
        "surName": "Libby",
      }
    `);
  });
});
