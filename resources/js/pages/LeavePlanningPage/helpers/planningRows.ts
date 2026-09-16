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

const ROLES_BY_VIEW: Record<PersonView, string[]> = {
  instructors: ["PI", "SI"],
  tas: ["TA"],
};

export type PersonView = Exclude<TeachingView, "courses">;

export interface LeaveRow {
  person: PlanningPerson;
  leaves: PlanningLeave[];
}

export interface PersonHistoryRow extends LeaveRow {
  sectionsByTerm: Map<number, TeachingSection[]>;
  sectionCount: number;
}

export interface CourseRow {
  courseCode: string;
  subject: string;
  catalogNumber: string;
  title: string;
  sectionsByTerm: Map<number, TeachingSection[]>;
  sectionCount: number;
}

export interface CourseView {
  onLeave: LeaveRow[];
  courses: CourseRow[];
}

const allows = (chosen: string[], value: string) =>
  chosen.length === 0 || chosen.includes(value);

export const matchesPerson = (
  person: PlanningPerson,
  filters: PlanningFilters,
): boolean =>
  allows(filters.person, String(person.emplid)) &&
  (filters.category.length === 0 ||
    person.categories.some((category) => filters.category.includes(category)));

export const matchesLeave = (
  leave: PlanningLeave,
  filters: PlanningFilters,
): boolean =>
  allows(filters.leaveType, leave.type) && allows(filters.status, leave.status);

export const matchesSection = (
  section: TeachingSection,
  filters: PlanningFilters,
): boolean =>
  allows(filters.course, section.courseCode) &&
  allows(filters.component, section.component);

const isNarrowingSections = (filters: PlanningFilters) =>
  filters.course.length > 0 || filters.component.length > 0;

const isNarrowingLeaves = (filters: PlanningFilters) =>
  filters.leaveType.length > 0 || filters.status.length > 0;

const isNarrowingPeople = (filters: PlanningFilters) =>
  filters.person.length > 0 || filters.category.length > 0;

function groupByTerm(sections: TeachingSection[]) {
  const byTerm = new Map<number, TeachingSection[]>();
  for (const section of sections) {
    byTerm.set(section.termId, [...(byTerm.get(section.termId) ?? []), section]);
  }
  return byTerm;
}

function leavesByEmplidOf(leaves: PlanningLeave[], filters: PlanningFilters) {
  const byEmplid = new Map<number, PlanningLeave[]>();
  for (const leave of leaves.filter((each) => matchesLeave(each, filters))) {
    byEmplid.set(leave.emplid, [...(byEmplid.get(leave.emplid) ?? []), leave]);
  }
  return byEmplid;
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
      sectionsByEmplid.set(emplid, [
        ...(sectionsByEmplid.get(emplid) ?? []),
        section,
      ]);
    }
  }

  const leavesByEmplid = leavesByEmplidOf(leaves, filters);

  const isOnRoster = (person: PlanningPerson) =>
    sectionsByEmplid.has(person.emplid) ||
    (view === "instructors" && person.hasAppointment);

  return history.people
    .filter(isOnRoster)
    .filter((person) => matchesPerson(person, filters))
    .map((person) => {
      const sections = (sectionsByEmplid.get(person.emplid) ?? []).filter(
        (section) => matchesSection(section, filters),
      );
      return {
        person,
        leaves: leavesByEmplid.get(person.emplid) ?? [],
        sectionsByTerm: groupByTerm(sections),
        sectionCount: sections.length,
      };
    })
    .filter(
      (row) =>
        (!isNarrowingSections(filters) || row.sectionCount > 0) &&
        (!isNarrowingLeaves(filters) || row.leaves.length > 0),
    );
}

export function courseViewOf(
  history: TeachingHistory,
  timeline: LeaveTimeline | null,
  filters: PlanningFilters,
): CourseView {
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
    sectionsByCourse.set(section.courseCode, [
      ...(sectionsByCourse.get(section.courseCode) ?? []),
      section,
    ]);
  }

  const courses = [...sectionsByCourse.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([courseCode, courseSections]) => {
      const latest = courseSections.reduce((newest, section) =>
        section.termId > newest.termId ? section : newest,
      );
      return {
        courseCode,
        subject: latest.subject,
        catalogNumber: latest.catalogNumber,
        title: latest.title,
        sectionsByTerm: groupByTerm(courseSections),
        sectionCount: courseSections.length,
      };
    });

  return {
    onLeave: timeline ? leaveRowsOf(timeline, filters) : [],
    courses,
  };
}
