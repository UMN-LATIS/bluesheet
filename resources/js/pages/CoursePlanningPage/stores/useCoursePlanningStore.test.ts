import { setActivePinia, createPinia } from "pinia";
import { useCoursePlanningStore } from "./useCoursePlanningStore";
import { usePersonStore } from "./usePersonStore";
import { useEnrollmentStore } from "./useEnrollmentStore";
import { useCourseSectionStore } from "./useCourseSectionStore";
import { useCourseStore } from "./useCourseStore";
import { useTermStore } from "@/stores/useTermStore";
import { useLeaveStore } from "./useLeaveStore";
import * as T from "@/types";

// Helpers to build test fixtures with sensible defaults

const makePerson = (overrides: Partial<T.Person> & Pick<T.Person, "id" | "emplid" | "displayName">): T.Person => ({
  title: "Professor",
  jobCodes: [],
  hasActiveDeptAppointment: true,
  givenName: overrides.displayName.split(" ")[0],
  surName: overrides.displayName.split(" ")[1] ?? "",
  email: `${overrides.displayName.replace(" ", ".").toLowerCase()}@umn.edu`,
  academicAppointments: ["Faculty"],
  leaveIds: [],
  midcareerEligible: false,
  sslEligible: false,
  sslApplyEligible: false,
  ...overrides,
});

const makeTerm = (overrides: Partial<T.Term> & Pick<T.Term, "id" | "name">): T.Term => ({
  startDate: "2019-01-01",
  endDate: "2019-05-15",
  ...overrides,
});

const makeCourse = (overrides: Partial<T.Course> & Pick<T.Course, "id">): T.Course => ({
  courseCode: overrides.id as T.CourseShortCode,
  subject: overrides.id.split("-")[0],
  catalogNumber: overrides.id.split("-")[1],
  title: `Course ${overrides.id}`,
  courseType: "LEC",
  courseLevel: "UGRD",
  source: "sis",
  ...overrides,
});

const makeSection = (
  overrides: Partial<T.CourseSection> & Pick<T.CourseSection, "id" | "courseId" | "termId">,
): T.CourseSection => ({
  classNumber: null,
  dbId: null,
  classSection: "001",
  waitlistCap: 0,
  waitlistTotal: 0,
  enrollmentCap: 25,
  enrollmentTotal: 10,
  isCancelled: false,
  isPublished: true,
  groupId: 1,
  source: "sis",
  ...overrides,
});

const makeEnrollment = (
  overrides: Partial<T.Enrollment> & Pick<T.Enrollment, "id" | "emplid" | "sectionId">,
): T.Enrollment => ({
  dbId: null,
  sectionDbId: null,
  role: "PI" as T.EnrollmentRole,
  ...overrides,
});

/**
 * Seed all sub-stores with the provided data, bypassing API calls.
 */
function seedStores({
  people,
  terms,
  courses,
  sections,
  enrollments,
}: {
  people: T.Person[];
  terms: T.Term[];
  courses: T.Course[];
  sections: T.CourseSection[];
  enrollments: T.Enrollment[];
}) {
  const personStore = usePersonStore();
  const enrollmentStore = useEnrollmentStore();
  const courseSectionStore = useCourseSectionStore();
  const courseStore = useCourseStore();
  const termStore = useTermStore();

  // Directly set internal state via $patch to avoid API calls
  personStore.$patch({
    activeGroupId: 1,
    personLookupByEmpId: Object.fromEntries(people.map((p) => [p.emplid, p])),
  });

  enrollmentStore.$patch({
    activeGroupId: 1,
    enrollmentLookup: Object.fromEntries(enrollments.map((e) => [e.id, e])),
  });

  courseSectionStore.$patch({
    activeGroupId: 1,
    sectionLookup: Object.fromEntries(sections.map((s) => [s.id, s])),
  });

  courseStore.$patch({
    activeGroupId: 1,
    courseLookup: Object.fromEntries(courses.map((c) => [c.id, c])),
  });

  termStore.$patch({
    termLookup: Object.fromEntries(terms.map((t) => [t.id, t])),
    loadStatus: "complete",
  });
}

// ── Test data ──────────────────────────────────────────────────────────
// 3 terms spanning Spring 2019 → Spring 2020
const TERM_1195 = makeTerm({ id: 1195, name: "Spring 2019", startDate: "2019-01-22", endDate: "2019-05-13" });
const TERM_1199 = makeTerm({ id: 1199, name: "Fall 2019", startDate: "2019-09-03", endDate: "2019-12-18" });
const TERM_1203 = makeTerm({ id: 1203, name: "Spring 2020", startDate: "2020-01-21", endDate: "2020-05-11" });

// Person A: only teaches in term 1195 (outside the filtered range)
const PERSON_A = makePerson({ id: 1, emplid: 101, displayName: "Alice Oldterm" });

// Person B: teaches in terms 1195 and 1199 (1199 is inside the filtered range)
const PERSON_B = makePerson({ id: 2, emplid: 102, displayName: "Bob Activeterm" });

const COURSE_AFRO_3601 = makeCourse({ id: "AFRO-3601W" as T.CourseShortCode });
const COURSE_AFRO_3654 = makeCourse({ id: "AFRO-3654" as T.CourseShortCode });

// Sections: Person A's section is only in term 1195
const SECTION_A_1195 = makeSection({
  id: "AFRO-3601W-001-1195" as T.CourseSection["id"],
  courseId: "AFRO-3601W" as T.CourseShortCode,
  termId: 1195,
});

// Person B has sections in 1195 AND 1199
const SECTION_B_1195 = makeSection({
  id: "AFRO-3654-001-1195" as T.CourseSection["id"],
  courseId: "AFRO-3654" as T.CourseShortCode,
  termId: 1195,
});

const SECTION_B_1199 = makeSection({
  id: "AFRO-3654-001-1199" as T.CourseSection["id"],
  courseId: "AFRO-3654" as T.CourseShortCode,
  termId: 1199,
});

// Enrollments
const ENROLLMENT_A_1195 = makeEnrollment({
  id: "101_AFRO-3601W-001-1195" as T.Enrollment["id"],
  emplid: 101,
  sectionId: SECTION_A_1195.id,
});

const ENROLLMENT_B_1195 = makeEnrollment({
  id: "102_AFRO-3654-001-1195" as T.Enrollment["id"],
  emplid: 102,
  sectionId: SECTION_B_1195.id,
});

const ENROLLMENT_B_1199 = makeEnrollment({
  id: "102_AFRO-3654-001-1199" as T.Enrollment["id"],
  emplid: 102,
  sectionId: SECTION_B_1199.id,
});

// ── Tests ──────────────────────────────────────────────────────────────
describe("useCoursePlanningStore - date range filtering", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should hide people who have no enrollments within the visible term range", () => {
    seedStores({
      people: [PERSON_A, PERSON_B],
      terms: [TERM_1195, TERM_1199, TERM_1203],
      courses: [COURSE_AFRO_3601, COURSE_AFRO_3654],
      sections: [SECTION_A_1195, SECTION_B_1195, SECTION_B_1199],
      enrollments: [ENROLLMENT_A_1195, ENROLLMENT_B_1195, ENROLLMENT_B_1199],
    });

    const store = useCoursePlanningStore();

    // Set active group so the store doesn't throw
    store.$patch({ activeGroupId: 1 });

    // Narrow the date range to only Fall 2019 → Spring 2020
    // Person A has NO enrollments in this range (only in 1195)
    // Person B has an enrollment in 1199 (within range)
    store.$patch({
      filters: {
        startTermId: 1199,
        endTermId: 1203,
        excludedCourseTypes: new Set(),
        excludedCourseLevels: new Set(),
        excludedAcadAppts: new Set(),
        includedEnrollmentRoles: new Set(["PI"]),
        onlyActiveAppointments: false, // include all people regardless
        minSectionEnrollment: 0,
        search: "",
        inPlanningMode: false,
      },
    });

    // Person B (emplid 102) should be visible — has enrollment in term 1199
    expect(store.isPersonVisible(PERSON_B.emplid)).toBe(true);

    // Person A (emplid 101) should NOT be visible — only has enrollment in term 1195,
    // which is outside the filtered range of 1199-1203
    expect(store.isPersonVisible(PERSON_A.emplid)).toBe(false);
  });

  it("should include people with leaves in the visible term range even if they have no enrollments in that range", () => {
    const leaveStore = useLeaveStore();
    const personAWithLeave = {
      ...PERSON_A,
      leaveIds: [1],
    };

    seedStores({
      people: [personAWithLeave, PERSON_B],
      terms: [TERM_1195, TERM_1199, TERM_1203],
      courses: [COURSE_AFRO_3601, COURSE_AFRO_3654],
      sections: [SECTION_A_1195, SECTION_B_1195, SECTION_B_1199],
      enrollments: [ENROLLMENT_A_1195, ENROLLMENT_B_1195, ENROLLMENT_B_1199],
    });

    // Give Person A a leave that falls in the visible range
    leaveStore.$patch({
      activeGroupId: 1,
      leaveLookup: {
        1: {
          id: 1,
          user_id: PERSON_A.id,
          description: "Sabbatical Leave",
          type: "sabbatical",
          status: "confirmed",
          start_date: "2019-09-01",
          end_date: "2020-05-15",
          termIds: [1199, 1203],
          created_at: "2019-01-01T00:00:00.000000Z",
          updated_at: "2019-01-01T00:00:00.000000Z",
        },
      },
    });

    const store = useCoursePlanningStore();
    store.$patch({ activeGroupId: 1 });
    store.$patch({
      filters: {
        startTermId: 1199,
        endTermId: 1203,
        excludedCourseTypes: new Set(),
        excludedCourseLevels: new Set(),
        excludedAcadAppts: new Set(),
        includedEnrollmentRoles: new Set(["PI"]),
        onlyActiveAppointments: false,
        minSectionEnrollment: 0,
        search: "",
        inPlanningMode: false,
      },
    });

    // Person A has no enrollments in 1199-1203, but DOES have a leave in that range.
    // They should still be visible so planners can see their leave status.
    expect(store.isPersonVisible(personAWithLeave.emplid)).toBe(true);
  });
});
