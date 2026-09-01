/**
 * Builds what the filter sidebar lists and what a filter chip prints, from
 * the term's loaded sections. Every section counts, crosslist partners
 * included: this module does not decide what is filtered out, only what the
 * filter controls can say.
 */

import type { FilterFacet, SisInstructor, SisSection } from "../types";
import { TBA_PERSON } from "../types";

export interface CourseOption {
  /** The filter value: `section.courseCode`, e.g. "HIST-1082". */
  value: string;
  /** How the code prints: subject, space, catalog number, e.g. "HIST 1082". */
  code: string;
  title: string;
  credits: number | null;
  sectionCount: number;
}

export interface CourseLevel {
  /** "1000-level", "2000-level", ... or "Other". */
  label: string;
  courses: CourseOption[];
}

export interface PersonOption {
  /** The filter value: the emplid as a string, or TBA_PERSON. */
  value: string;
  /** Full name, e.g. "Ana García". "TBA" for the TBA row. */
  name: string;
  /** For a chip: first initial and last name, e.g. "A. García". "TBA" for the TBA row. */
  shortName: string;
  sectionCount: number;
}

export interface SectionOption {
  /** The filter value: `String(section.id)`. */
  value: string;
  /** e.g. "HIST 1082 · 001" */
  label: string;
  component: string;
  /** The lead instructor's last name (role PI, else the first instructor), or null when there is none. */
  instructorLastName: string | null;
}

export interface ComponentOption {
  /** The filter value and the printed code, e.g. "LEC". */
  value: string;
  sectionCount: number;
}

export interface FilterOptions {
  courseLevels: CourseLevel[];
  /** Instructors holding role "PI" or "SI" on at least one section. TA rows are not listed. */
  faculty: PersonOption[];
  /** Present when at least one section has no instructors; its count is how many. */
  tba: PersonOption | null;
  sections: SectionOption[];
  components: ComponentOption[];
}

/** A course option beside the fields it is grouped and sorted by. */
interface CourseDraft {
  option: CourseOption;
  subject: string;
  catalogNumber: string;
}

function courseLevelLabel(catalogNumber: string): string {
  const firstChar = catalogNumber[0];
  return firstChar !== undefined && /[0-9]/.test(firstChar)
    ? `${firstChar}000-level`
    : "Other";
}

function buildCourseLevels(sections: SisSection[]): CourseLevel[] {
  const courses = new Map<string, CourseDraft>();

  for (const section of sections) {
    const existing = courses.get(section.courseCode);
    if (existing) {
      existing.option.sectionCount += 1;
      continue;
    }
    courses.set(section.courseCode, {
      option: {
        value: section.courseCode,
        code: `${section.subject} ${section.catalogNumber}`,
        title: section.title,
        credits: section.credits,
        sectionCount: 1,
      },
      subject: section.subject,
      catalogNumber: section.catalogNumber,
    });
  }

  const draftsByLevel = new Map<string, CourseDraft[]>();
  for (const draft of courses.values()) {
    const label = courseLevelLabel(draft.catalogNumber);
    const bucket = draftsByLevel.get(label);
    if (bucket) {
      bucket.push(draft);
    } else {
      draftsByLevel.set(label, [draft]);
    }
  }

  return [...draftsByLevel.entries()]
    .sort(([a], [b]) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return Number(a[0]) - Number(b[0]);
    })
    .map(([label, drafts]) => ({
      label,
      courses: [...drafts]
        .sort((a, b) => {
          const subjectCompare = a.subject.localeCompare(b.subject);
          if (subjectCompare !== 0) return subjectCompare;
          return a.catalogNumber.localeCompare(b.catalogNumber);
        })
        .map(({ option }) => option),
    }));
}

function isFacultyRole(role: string): boolean {
  return role === "PI" || role === "SI";
}

function facultyName(instructor: SisInstructor): string {
  return (
    instructor.name ??
    instructor.lastName ??
    instructor.internetId ??
    String(instructor.emplid)
  );
}

/** A faculty option beside the last name it is sorted by. */
interface FacultyDraft {
  option: PersonOption;
  lastName: string | null;
}

function buildFaculty(sections: SisSection[]): {
  faculty: PersonOption[];
  tba: PersonOption | null;
} {
  const draftsByEmplid = new Map<
    number,
    {
      name: string;
      shortName: string;
      lastName: string | null;
      sectionIds: Set<number>;
    }
  >();
  let tbaSectionCount = 0;

  for (const section of sections) {
    if (section.instructors.length === 0) {
      tbaSectionCount += 1;
    }

    for (const instructor of section.instructors) {
      if (!isFacultyRole(instructor.role)) continue;

      let draft = draftsByEmplid.get(instructor.emplid);
      if (!draft) {
        const name = facultyName(instructor);
        // "A. García" only when there's a real name to take the initial
        // from and a last name to show; otherwise a fallback name already
        // reads fine on its own.
        const shortName =
          instructor.name && instructor.lastName
            ? `${name[0]}. ${instructor.lastName}`
            : name;
        draft = {
          name,
          shortName,
          lastName: instructor.lastName,
          sectionIds: new Set(),
        };
        draftsByEmplid.set(instructor.emplid, draft);
      }
      draft.sectionIds.add(section.id);
    }
  }

  const faculty: FacultyDraft[] = [...draftsByEmplid.entries()].map(
    ([emplid, draft]) => ({
      option: {
        value: String(emplid),
        name: draft.name,
        shortName: draft.shortName,
        sectionCount: draft.sectionIds.size,
      },
      lastName: draft.lastName,
    }),
  );

  faculty.sort((a, b) => {
    if (a.lastName === null && b.lastName === null) {
      return a.option.name.localeCompare(b.option.name);
    }
    if (a.lastName === null) return 1;
    if (b.lastName === null) return -1;
    const lastNameCompare = a.lastName.localeCompare(b.lastName);
    if (lastNameCompare !== 0) return lastNameCompare;
    return a.option.name.localeCompare(b.option.name);
  });

  const tba: PersonOption | null =
    tbaSectionCount > 0
      ? {
          value: TBA_PERSON,
          name: "TBA",
          shortName: "TBA",
          sectionCount: tbaSectionCount,
        }
      : null;

  return {
    faculty: faculty.map(({ option }) => option),
    tba,
  };
}

function leadInstructorLastName(instructors: SisInstructor[]): string | null {
  if (instructors.length === 0) return null;
  const primaryInstructor = instructors.find(
    (instructor) => instructor.role === "PI",
  );
  return (primaryInstructor ?? instructors[0]).lastName;
}

function buildSections(sections: SisSection[]): SectionOption[] {
  return [...sections]
    .sort((a, b) => {
      const courseCodeCompare = a.courseCode.localeCompare(b.courseCode);
      if (courseCodeCompare !== 0) return courseCodeCompare;
      return a.section.localeCompare(b.section);
    })
    .map((section) => ({
      value: String(section.id),
      label: `${section.subject} ${section.catalogNumber} · ${section.section}`,
      component: section.component,
      instructorLastName: leadInstructorLastName(section.instructors),
    }));
}

function buildComponents(sections: SisSection[]): ComponentOption[] {
  const sectionCountByComponent = new Map<string, number>();
  for (const section of sections) {
    sectionCountByComponent.set(
      section.component,
      (sectionCountByComponent.get(section.component) ?? 0) + 1,
    );
  }

  return [...sectionCountByComponent.entries()]
    .map(([value, sectionCount]) => ({ value, sectionCount }))
    .sort((a, b) => {
      if (a.sectionCount !== b.sectionCount)
        return b.sectionCount - a.sectionCount;
      return a.value.localeCompare(b.value);
    });
}

export function buildFilterOptions(sections: SisSection[]): FilterOptions {
  const { faculty, tba } = buildFaculty(sections);

  return {
    courseLevels: buildCourseLevels(sections),
    faculty,
    tba,
    sections: buildSections(sections),
    components: buildComponents(sections),
  };
}

/** The text a chip prints for one checked value. Falls back to the raw value when the options do not know it (e.g. a stale URL). */
export function optionLabel(
  options: FilterOptions,
  facet: FilterFacet,
  value: string,
): string {
  switch (facet) {
    case "course": {
      const course = options.courseLevels
        .flatMap((level) => level.courses)
        .find((candidate) => candidate.value === value);
      return course?.code ?? value;
    }
    case "person": {
      if (options.tba?.value === value) return options.tba.shortName;
      const person = options.faculty.find(
        (candidate) => candidate.value === value,
      );
      return person?.shortName ?? value;
    }
    case "section": {
      const section = options.sections.find(
        (candidate) => candidate.value === value,
      );
      return section?.label ?? value;
    }
    case "component": {
      const component = options.components.find(
        (candidate) => candidate.value === value,
      );
      return component?.value ?? value;
    }
  }
}
