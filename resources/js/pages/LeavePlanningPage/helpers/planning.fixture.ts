import type {
  LeaveTimeline,
  PlanningLeave,
  PlanningPerson,
  PlanningTerm,
  TeachingHistory,
  TeachingSection,
} from "@/types";

export const SPRING_2026: PlanningTerm = {
  id: 1263,
  name: "Spring 2026",
  startDate: "2026-01-20",
  endDate: "2026-05-13",
};
export const SUMMER_2026: PlanningTerm = {
  id: 1265,
  name: "Summer 2026",
  startDate: "2026-05-18",
  endDate: "2026-08-14",
};
export const FALL_2026: PlanningTerm = {
  id: 1269,
  name: "Fall 2026",
  startDate: "2026-09-08",
  endDate: "2026-12-23",
};
export const SPRING_2027: PlanningTerm = {
  id: 1273,
  name: "Spring 2027",
  startDate: "2027-01-19",
  endDate: "2027-05-12",
};

export const TERMS = [SPRING_2027, FALL_2026, SUMMER_2026, SPRING_2026];

export function person(
  emplid: number,
  overrides: Partial<PlanningPerson> = {},
): PlanningPerson {
  return {
    emplid,
    userId: emplid + 1000,
    name: `Person ${emplid}`,
    firstName: `First${emplid}`,
    lastName: `Last${emplid}`,
    title: "Professor",
    categories: ["Faculty"],
    jobCodes: ["9401"],
    hasAppointment: true,
    sslEligible: false,
    sslApplyEligible: false,
    midcareerEligible: false,
    ...overrides,
  };
}

let nextLeaveId = 1;

export function leave(
  emplid: number,
  startDate: string,
  endDate: string,
  overrides: Partial<PlanningLeave> = {},
): PlanningLeave {
  return {
    id: nextLeaveId++,
    emplid,
    userId: emplid + 1000,
    type: "sabbatical",
    status: "confirmed",
    startDate,
    endDate,
    description: "",
    ...overrides,
  };
}

export function section(
  courseCode: string,
  termId: number,
  instructors: [emplid: number, role: string][],
  overrides: Partial<TeachingSection> = {},
): TeachingSection {
  const [subject, catalogNumber] = courseCode.split("-");
  const sectionNumber = overrides.section ?? "001";
  return {
    key: `${courseCode}-${sectionNumber}-${termId}`,
    termId,
    courseCode,
    subject,
    catalogNumber,
    section: sectionNumber,
    title: `Title of ${courseCode}`,
    component: "LEC",
    enrollmentTotal: 20,
    enrollmentCap: 30,
    isPlanned: false,
    instructors: instructors.map(([emplid, role]) => ({ emplid, role })),
    ...overrides,
  };
}

export const timelineOf = (
  people: PlanningPerson[],
  leaves: PlanningLeave[],
  range = { startTermId: FALL_2026.id, endTermId: SPRING_2027.id },
): LeaveTimeline => ({ range, people, leaves });

export const historyOf = (
  people: PlanningPerson[],
  sections: TeachingSection[],
): TeachingHistory => ({ people, sections });
