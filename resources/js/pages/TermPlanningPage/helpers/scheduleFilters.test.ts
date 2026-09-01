import { describe, expect, it } from "vitest";
import { filterSections, isFiltering } from "./scheduleFilters";
import type { ScheduleFilters, SisInstructor, SisSection } from "../types";
import { TBA_PERSON } from "../types";

const emptyFilters = (): ScheduleFilters => ({
  course: [],
  person: [],
  section: [],
  component: [],
});

const instructor = (
  emplid: number,
  role: string,
  extra: Partial<SisInstructor> = {},
): SisInstructor => ({
  emplid,
  role,
  name: "A Teacher",
  lastName: "Teacher",
  internetId: "teacher1",
  ...extra,
});

const section = (id: number, extra: Partial<SisSection> = {}): SisSection => ({
  id,
  classNumber: 50000 + id,
  termId: 1269,
  courseCode: "ANTH-1001",
  subject: "ANTH",
  catalogNumber: "1001",
  section: "001",
  title: "Understanding Cultures",
  component: "LEC",
  credits: 3,
  enrollmentCap: 30,
  enrollmentTotal: 20,
  waitlistCap: 5,
  waitlistTotal: 0,
  instructors: [],
  meetings: [],
  crosslist: null,
  ...extra,
});

describe("isFiltering", () => {
  it("is false when every facet is empty", () => {
    expect(isFiltering(emptyFilters())).toBe(false);
  });

  it("is true once any facet has a checked value", () => {
    expect(isFiltering({ ...emptyFilters(), course: ["ANTH-1001"] })).toBe(
      true,
    );
  });
});

describe("filterSections", () => {
  it("returns every section, in order, when no facet is checked", () => {
    const sections = [section(1), section(2)];

    expect(filterSections(sections, emptyFilters())).toEqual(sections);
  });

  it("ORs values within a facet", () => {
    const sections = [
      section(1, { courseCode: "ANTH-1001" }),
      section(2, { courseCode: "HIST-1082" }),
      section(3, { courseCode: "BIOL-1001" }),
    ];

    const result = filterSections(sections, {
      ...emptyFilters(),
      course: ["ANTH-1001", "HIST-1082"],
    });

    expect(result.map((s) => s.id)).toEqual([1, 2]);
  });

  it("ANDs across facets", () => {
    const target = instructor(111, "PI");
    const sections = [
      section(1, { courseCode: "HIST-1082", instructors: [target] }),
      section(2, {
        courseCode: "HIST-1082",
        instructors: [instructor(222, "PI")],
      }),
      section(3, { courseCode: "ANTH-1001", instructors: [target] }),
    ];

    const result = filterSections(sections, {
      ...emptyFilters(),
      course: ["HIST-1082"],
      person: ["111"],
    });

    expect(result.map((s) => s.id)).toEqual([1]);
  });

  it("matches TBA_PERSON only against sections with no instructor", () => {
    const sections = [
      section(1, { instructors: [] }),
      section(2, { instructors: [instructor(111, "PI")] }),
    ];

    const result = filterSections(sections, {
      ...emptyFilters(),
      person: [TBA_PERSON],
    });

    expect(result.map((s) => s.id)).toEqual([1]);
  });

  it("matches a person regardless of their role on the section", () => {
    const sections = [
      section(1, { instructors: [instructor(111, "PI")] }),
      section(2, { instructors: [instructor(111, "TA")] }),
      section(3, { instructors: [instructor(222, "PI")] }),
    ];

    const result = filterSections(sections, {
      ...emptyFilters(),
      person: ["111"],
    });

    expect(result.map((s) => s.id)).toEqual([1, 2]);
  });

  it("filters by section id", () => {
    const sections = [section(1), section(2)];

    const result = filterSections(sections, {
      ...emptyFilters(),
      section: ["2"],
    });

    expect(result.map((s) => s.id)).toEqual([2]);
  });

  it("filters by component", () => {
    const sections = [
      section(1, { component: "LEC" }),
      section(2, { component: "DIS" }),
    ];

    const result = filterSections(sections, {
      ...emptyFilters(),
      component: ["DIS"],
    });

    expect(result.map((s) => s.id)).toEqual([2]);
  });

  it("yields nothing when one facet matches but another does not", () => {
    const sections = [
      section(1, { courseCode: "HIST-1082", component: "LEC" }),
    ];

    const result = filterSections(sections, {
      ...emptyFilters(),
      course: ["HIST-1082"],
      component: ["DIS"],
    });

    expect(result).toEqual([]);
  });
});
