import { describe, expect, it } from "vitest";
import {
  sectionIdsUnder,
  sectionsByFacetValue,
  selectionStateOf,
  valuesWithAnySelection,
  withSectionsSelected,
} from "./sectionSelection";
import { plannedSection } from "./plannedSection.fixture";
import type { SisSection } from "../types";

const section = (id: number, overrides: Partial<SisSection>): SisSection =>
  plannedSection(id, [], overrides);

const SECTIONS = [
  section(1, {
    courseCode: "ANTH-1001",
    component: "LEC",
    instructors: [{ emplid: 10, role: "PI", name: "A", lastName: "A", internetId: null }],
  }),
  section(2, {
    courseCode: "ANTH-1001",
    component: "LEC",
    instructors: [{ emplid: 10, role: "PI", name: "A", lastName: "A", internetId: null }],
  }),
  section(3, { courseCode: "ANTH-3001", component: "LAB", instructors: [] }),
];

const byValue = sectionsByFacetValue(SECTIONS);

describe("sectionsByFacetValue", () => {
  it("lists a course's sections under its code", () => {
    expect(sectionIdsUnder(byValue, "course", ["ANTH-1001"])).toEqual([1, 2]);
  });

  it("lists a person under every section they teach", () => {
    expect(sectionIdsUnder(byValue, "person", ["10"])).toEqual([1, 2]);
  });

  it("files a section with no instructor under TBA", () => {
    expect(sectionIdsUnder(byValue, "person", ["tba"])).toEqual([3]);
  });

  it("counts a section once when two values name it", () => {
    expect(sectionIdsUnder(byValue, "course", ["ANTH-1001", "ANTH-1001"])).toEqual([1, 2]);
  });

  it("gives nothing for a value no section carries", () => {
    expect(sectionIdsUnder(byValue, "course", ["HIST-1000"])).toEqual([]);
  });
});

describe("selectionStateOf", () => {
  it("is all when every section under the value is chosen", () => {
    expect(selectionStateOf(byValue, new Set([1, 2]), "course", ["ANTH-1001"]))
      .toBe("all");
  });

  it("is some when only part of the value is chosen", () => {
    expect(selectionStateOf(byValue, new Set([1]), "course", ["ANTH-1001"]))
      .toBe("some");
  });

  it("is none when nothing under the value is chosen", () => {
    expect(selectionStateOf(byValue, new Set([3]), "course", ["ANTH-1001"]))
      .toBe("none");
  });

  it("is none for a value standing for no sections", () => {
    expect(selectionStateOf(byValue, new Set([1, 2, 3]), "course", ["HIST-1000"]))
      .toBe("none");
  });

  it("reads a group of values as one, which is how a level row behaves", () => {
    const everything = ["ANTH-1001", "ANTH-3001"];

    expect(selectionStateOf(byValue, new Set([1, 2]), "course", everything))
      .toBe("some");
    expect(selectionStateOf(byValue, new Set([1, 2, 3]), "course", everything))
      .toBe("all");
  });
});

describe("withSectionsSelected", () => {
  it("adds without disturbing what was already chosen", () => {
    expect([...withSectionsSelected(new Set([1]), [2, 3], true)]).toEqual([1, 2, 3]);
  });

  it("removes only the ids named", () => {
    expect([...withSectionsSelected(new Set([1, 2, 3]), [2], false)]).toEqual([1, 3]);
  });

  it("leaves the set it was given alone", () => {
    const before = new Set([1]);
    withSectionsSelected(before, [2], true);

    expect([...before]).toEqual([1]);
  });
});

describe("valuesWithAnySelection", () => {
  it("counts a course as chosen once any of its sections is", () => {
    expect(valuesWithAnySelection(byValue, new Set([1]), "course"))
      .toEqual({ count: 1, total: 2 });
  });

  it("counts every value when everything is chosen", () => {
    expect(valuesWithAnySelection(byValue, new Set([1, 2, 3]), "component"))
      .toEqual({ count: 2, total: 2 });
  });

  it("counts none when nothing is chosen", () => {
    expect(valuesWithAnySelection(byValue, new Set(), "section"))
      .toEqual({ count: 0, total: 3 });
  });
});
