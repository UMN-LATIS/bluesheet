import { describe, expect, it } from "vitest";
import { appliedScheduleFilters } from "./appliedScheduleFilters";
import { buildFilterOptions } from "./filterOptions";
import type { ScheduleFilters, SisSection } from "../types";
import { TBA_PERSON } from "../types";

const section = (id: number, extra: Partial<SisSection> = {}): SisSection => ({
  id,
  classNumber: 50000 + id,
  termCode: 1269,
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

const sections: SisSection[] = [
  section(1, {
    instructors: [
      {
        emplid: 4542085,
        role: "PI",
        name: "Nandi Tippett",
        lastName: "Tippett",
        internetId: "tippe018",
      },
    ],
  }),
  section(2, {
    courseCode: "ANTH-3011",
    catalogNumber: "3011",
    section: "002",
    title: "Field Methods",
    component: "LAB",
  }),
];

const options = buildFilterOptions(sections);

const filters = (extra: Partial<ScheduleFilters> = {}): ScheduleFilters => ({
  course: [],
  person: [],
  section: [],
  component: [],
  ...extra,
});

describe("appliedScheduleFilters", () => {
  it("is empty when nothing is checked", () => {
    expect(appliedScheduleFilters(options, filters())).toEqual([]);
  });

  it("names a course as the panel prints it, not as the filter stores it", () => {
    expect(
      appliedScheduleFilters(options, filters({ course: ["ANTH-1001"] })),
    ).toEqual([{ facet: "course", values: ["ANTH 1001"] }]);
  });

  it("names a person last name first", () => {
    expect(
      appliedScheduleFilters(options, filters({ person: ["4542085"] })),
    ).toEqual([{ facet: "person", values: ["Tippett, Nandi"] }]);
  });

  it("names the unassigned row rather than its stored value", () => {
    expect(
      appliedScheduleFilters(options, filters({ person: [TBA_PERSON] })),
    ).toEqual([{ facet: "person", values: ["TBA"] }]);
  });

  it("drops the middot from a section label so it reads as one value", () => {
    expect(
      appliedScheduleFilters(options, filters({ section: ["2"] })),
    ).toEqual([{ facet: "section", values: ["ANTH 3011 002"] }]);
  });

  it("lists facets in the order the panel lists them", () => {
    const applied = appliedScheduleFilters(
      options,
      filters({ component: ["LAB"], course: ["ANTH-3011"] }),
    );
    expect(applied.map(({ facet }) => facet)).toEqual(["course", "component"]);
  });
});
