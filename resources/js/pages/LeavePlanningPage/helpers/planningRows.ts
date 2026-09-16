import type {
  LeaveTimeline,
  PlanningLeave,
  PlanningPerson,
  TeachingHistory,
  TeachingSection,
} from "@/types";
import type {
  PlanningFilters,
  TeachingView,
} from "../useLeavePlanningView/types";

type PersonView = Exclude<TeachingView, "courses">;

const ROLES_BY_VIEW: Record<PersonView, string[]> = {
  instructors: ["PI", "SI"],
  tas: ["TA"],
};

export interface LeaveRow {
  person: PlanningPerson;
  leaves: PlanningLeave[];
}

export interface PersonHistoryRow extends LeaveRow {
  sectionsByTerm: Map<number, TeachingSection[]>;
  sectionCount: number;
}

interface CourseRow {
  courseCode: string;
  subject: string;
  catalogNumber: string;
  title: string;
  sectionsByTerm: Map<number, TeachingSection[]>;
  sectionCount: number;
}

export interface CourseHistory {
  peopleOnLeave: LeaveRow[];
  courses: CourseRow[];
}

const allows = (chosen: string[], value: string) =>
  chosen.length === 0 || chosen.includes(value);

const allowsAny = (chosen: string[], values: string[]) =>
  chosen.length === 0 || values.some((value) => chosen.includes(value));

const matchesPerson = (person: PlanningPerson, filters: PlanningFilters) =>
  allows(filters.person, String(person.emplid)) &&
  allowsAny(filters.category, person.categories);

const matchesLeave = (leave: PlanningLeave, filters: PlanningFilters) =>
  allows(filters.leaveType, leave.type) && allows(filters.status, leave.status);

const matchesSection = (section: TeachingSection, filters: PlanningFilters) =>
  allows(filters.course, section.courseCode) &&
  allows(filters.component, section.component);

const isNarrowingSections = (filters: PlanningFilters) =>
  filters.course.length > 0 || filters.component.length > 0;

const isNarrowingLeaves = (filters: PlanningFilters) =>
  filters.leaveType.length > 0 || filters.status.length > 0;

const isNarrowingPeople = (filters: PlanningFilters) =>
  filters.person.length > 0 || filters.category.length > 0;

export const sectionsOf = (
  sectionsByTerm: Map<number, TeachingSection[]>,
): TeachingSection[] => [...sectionsByTerm.values()].flat();

export const mostSectionsInOneTerm = (
  sectionsByTerm: Map<number, TeachingSection[]>,
): number =>
  [...sectionsByTerm.values()].reduce(
    (most, sections) => Math.max(most, sections.length),
    0,
  );

function groupByTerm(sections: TeachingSection[]) {
  const sectionsByTerm = new Map<number, TeachingSection[]>();
  for (const section of sections) {
    const termSections = sectionsByTerm.get(section.termId) ?? [];
    sectionsByTerm.set(section.termId, [...termSections, section]);
  }
  return sectionsByTerm;
}

function leavesByEmplidOf(leaves: PlanningLeave[], filters: PlanningFilters) {
  const leavesByEmplid = new Map<number, PlanningLeave[]>();
  for (const leave of leaves.filter((each) => matchesLeave(each, filters))) {
    const personLeaves = leavesByEmplid.get(leave.emplid) ?? [];
    leavesByEmplid.set(leave.emplid, [...personLeaves, leave]);
  }
  return leavesByEmplid;
}

export function leaveRowsOf(
  timeline: LeaveTimeline,
  filters: PlanningFilters,
): LeaveRow[] {
  const leavesByEmplid = leavesByEmplidOf(timeline.leaves, filters);

  return timeline.people
    .filter((person) => matchesPerson(person, filters))
    .map((person) => ({
      person,
      leaves: leavesByEmplid.get(person.emplid) ?? [],
    }))
    .filter((row) => row.leaves.length > 0);
}

export function personHistoryRowsOf(
  history: TeachingHistory,
  leaves: PlanningLeave[],
  view: PersonView,
  filters: PlanningFilters,
): PersonHistoryRow[] {
  const roles = ROLES_BY_VIEW[view];
  const sectionsByEmplid = new Map<number, TeachingSection[]>();
  for (const section of history.sections) {
    const emplids = new Set(
      section.instructors
        .filter((instructor) => roles.includes(instructor.role))
        .map((instructor): number => instructor.emplid),
    );
    for (const emplid of emplids) {
      const personSections = sectionsByEmplid.get(emplid) ?? [];
      sectionsByEmplid.set(emplid, [...personSections, section]);
    }
  }

  const leavesByEmplid = leavesByEmplidOf(leaves, filters);

  const isOnRoster = (person: PlanningPerson) =>
    sectionsByEmplid.has(person.emplid) ||
    (view === "instructors" && person.hasAppointment);

  const survivesNarrowing = (row: PersonHistoryRow) => {
    if (isNarrowingSections(filters) && row.sectionCount === 0) return false;
    if (isNarrowingLeaves(filters) && row.leaves.length === 0) return false;
    return true;
  };

  return history.people
    .filter(isOnRoster)
    .filter((person) => matchesPerson(person, filters))
    .map((person) => {
      const allSections = sectionsByEmplid.get(person.emplid) ?? [];
      const sections = allSections.filter((section) =>
        matchesSection(section, filters),
      );
      return {
        person,
        leaves: leavesByEmplid.get(person.emplid) ?? [],
        sectionsByTerm: groupByTerm(sections),
        sectionCount: sections.length,
      };
    })
    .filter(survivesNarrowing);
}

export function courseHistoryOf(
  history: TeachingHistory,
  timeline: LeaveTimeline | null,
  filters: PlanningFilters,
): CourseHistory {
  const peopleByEmplid = new Map(
    history.people.map((person) => [person.emplid, person]),
  );

  const isTaughtByChosenPeople = (section: TeachingSection) =>
    !isNarrowingPeople(filters) ||
    section.instructors.some((instructor) => {
      const person = peopleByEmplid.get(instructor.emplid);
      return person !== undefined && matchesPerson(person, filters);
    });

  const sections = history.sections.filter(
    (section) =>
      matchesSection(section, filters) && isTaughtByChosenPeople(section),
  );

  const sectionsByCourse = new Map<string, TeachingSection[]>();
  for (const section of sections) {
    const courseSections = sectionsByCourse.get(section.courseCode) ?? [];
    sectionsByCourse.set(section.courseCode, [...courseSections, section]);
  }

  const courses = [...sectionsByCourse.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([courseCode, courseSections]) => {
      const latestSection = courseSections.reduce((latest, section) =>
        section.termId > latest.termId ? section : latest,
      );
      return {
        courseCode,
        subject: latestSection.subject,
        catalogNumber: latestSection.catalogNumber,
        title: latestSection.title,
        sectionsByTerm: groupByTerm(courseSections),
        sectionCount: courseSections.length,
      };
    });

  return {
    peopleOnLeave: timeline ? leaveRowsOf(timeline, filters) : [],
    courses,
  };
}
