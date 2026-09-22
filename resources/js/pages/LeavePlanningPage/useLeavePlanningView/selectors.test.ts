import { describe, expect, it } from "vitest";
import { selectActiveFacetOptions, selectIsDraftValid } from "./selectors";
import { initialState, update } from "./update";
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
    isWide: true,
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

describe("selectIsDraftValid", () => {
  const drafting = (startDate: string, endDate: string): ViewState =>
    update(initialState(), {
      type: "creationRequested",
      emplid: 900,
      startDate,
      endDate,
    }).state;

  const described = (state: ViewState): ViewState =>
    update(state, { type: "draftEdited", change: { description: "Fieldwork" } })
      .state;

  it("accepts a described leave whose end follows its start", () => {
    expect(
      selectIsDraftValid(described(drafting("2026-09-01", "2026-12-31"))),
    ).toBe(true);
  });

  it("refuses a cleared start date", () => {
    expect(selectIsDraftValid(described(drafting("", "2026-12-31")))).toBe(
      false,
    );
  });

  it("refuses a cleared end date", () => {
    expect(selectIsDraftValid(described(drafting("2026-09-01", "")))).toBe(
      false,
    );
  });
});
