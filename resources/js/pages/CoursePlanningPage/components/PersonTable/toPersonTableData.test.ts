import * as T from "@/types";
import { toPersonTableData } from "./toPersonTableData";

describe("usePersonTableData", () => {
  it("gets person table data", () => {
    const termLookup: Record<T.Term["id"], T.Term> = {
      1: {
        id: 1,
        name: "Fall 2021",
        startDate: "2021-08-01",
        endDate: "2021-12-31",
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
    };

    const enrollmentLookup: Record<T.Enrollment["id"], T.Enrollment> = {
      "sis-sis-39-12345": {
        id: "sis-sis-39-12345",
        dbId: null,
        emplid: 12345,
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
    };

    const personTableData = toPersonTableData({
      personLookup,
      termLookup,
      courseLookup,
      sectionLookup,
      enrollmentLookup,
      leaveLookup: leaveLookup,
    });

    expect(personTableData).toEqual([
      {
        id: 12345,
        person: personLookup[12345],
        termRecords: [
          {
            term: termLookup[1],
            leaves: [leaveLookup[1]],
            enrollments: [
              {
                person: personLookup[12345],
                term: termLookup[1],
                section: sectionLookup["sis-39"],
                course: courseLookup["AFRO-1009"],
                enrollment: enrollmentLookup["sis-sis-39-12345"],
              },
            ],
          },
        ],
      },
    ]);
  });
});
