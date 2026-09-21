import { describe, expect, it } from "vitest";
import { selectActiveFacetOptions } from "./selectors";
import { initialState } from "./update";
import type { TeachingView, ViewContext, ViewState } from "./types";
import {
  FALL_2026,
  TERMS,
  historyOf,
  person,
  section,
  timelineOf,
} from "../helpers/planning.fixture";

const okafor = person(1, { categories: ["Faculty"] });

const contextTeaching = (view: TeachingView): [ViewContext, ViewState] => [
  {
    timeline: timelineOf([okafor], []),
    teachingHistory: historyOf(
      [okafor],
      [
        section("ANTH-1001", FALL_2026.termCode, [[1, "PI"]], {
          section: "001",
        }),
        section("ANTH-1002", FALL_2026.termCode, [[1, "PI"]], {
          section: "002",
        }),
        section("ANTH-1003", FALL_2026.termCode, [[1, "PI"]], {
          section: "003",
        }),
      ],
    ),
    terms: TERMS,
    canViewCourses: true,
    canPlanTerms: false,
  },
  {
    ...initialState(),
    isHistoryRequested: true,
    view,
    activeFacet: "category",
  },
];

describe("selectActiveFacetOptions", () => {
  it("counts a person once per appointment category, however many sections they teach", () => {
    const annotationsByView = (["instructors", "courses"] as const).map(
      (view) =>
        selectActiveFacetOptions(...contextTeaching(view)).map(
          ({ label, annotation }) => [label, annotation],
        ),
    );

    expect(annotationsByView).toEqual([[["Faculty", "1"]], [["Faculty", "1"]]]);
  });
});
