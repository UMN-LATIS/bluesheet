import { describe, expect, it } from "vitest";
import { initialState, update } from "./update";
import type { ViewEvent, ViewState } from "./types";

const after = (events: ViewEvent[], state: ViewState = initialState()) =>
  events.reduce((current, event) => update(current, event).state, state);

describe("the URL", () => {
  it("a change the user makes is written back in one piece", () => {
    const { effects } = update(initialState(), {
      type: "filterValuesAdded",
      facet: "status",
      values: ["pending", "eligible"],
    });

    expect(effects).toEqual([
      { type: "replaceUrlQuery", query: { status: "pending,eligible" } },
    ]);
  });

  it("a change that came from the URL is not echoed back", () => {
    const { effects } = update(initialState(), {
      type: "urlChanged",
      query: { history: "1", view: "courses" },
    });

    expect(effects).toEqual([]);
  });

  it("an event that leaves the query as it was writes nothing", () => {
    const { effects } = update(initialState(), {
      type: "facetOpened",
      facet: "status",
    });

    expect(effects).toEqual([]);
  });

  it("restores the range, history, view, filters, and selection", () => {
    const state = after([
      {
        type: "urlChanged",
        query: {
          start: "1269",
          end: "1273",
          history: "1",
          view: "tas",
          course: "ANTH-1001",
          section: "ANTH-1001-003-FA26",
        },
      },
    ]);

    expect(state.range).toEqual({ startTermCode: 1269, endTermCode: 1273 });
    expect(state.isHistoryRequested).toBe(true);
    expect(state.view).toBe("tas");
    expect(state.filters.course).toEqual(["ANTH-1001"]);
    expect(state.selection).toEqual({
      kind: "section",
      sectionKey: "ANTH-1001-003-FA26",
    });
  });

  it("drops section filters and a section selection named without history", () => {
    const state = after([
      {
        type: "urlChanged",
        query: { course: "ANTH-1001", section: "ANTH-1001-003-FA26" },
      },
    ]);

    expect(state.filters.course).toEqual([]);
    expect(state.selection).toBeNull();
  });
});

describe("the term range", () => {
  it("moves the end up to a start chosen after it", () => {
    const state = after([
      { type: "rangeEndSelected", termCode: 1269 },
      { type: "rangeStartSelected", termCode: 1273 },
    ]);

    expect(state.range).toEqual({ startTermCode: 1273, endTermCode: 1273 });
  });

  it("moves the start back to an end chosen before it", () => {
    const state = after([
      { type: "rangeStartSelected", termCode: 1273 },
      { type: "rangeEndSelected", termCode: 1263 },
    ]);

    expect(state.range).toEqual({ startTermCode: 1263, endTermCode: 1263 });
  });

  it("leaves the unchosen side to the server", () => {
    const state = after([{ type: "rangeStartSelected", termCode: 1269 }]);

    expect(state.range).toEqual({ startTermCode: 1269, endTermCode: null });
  });
});

describe("turning history off", () => {
  const withHistory = after([
    { type: "historyToggled" },
    { type: "filterValuesAdded", facet: "course", values: ["ANTH-1001"] },
    { type: "filterValuesAdded", facet: "status", values: ["pending"] },
    { type: "facetOpened", facet: "component" },
    { type: "sectionSelected", sectionKey: "ANTH-1001-003-FA26" },
  ]);

  const withoutHistory = after([{ type: "historyToggled" }], withHistory);

  it("clears section filters and keeps leave filters", () => {
    expect(withoutHistory.filters.course).toEqual([]);
    expect(withoutHistory.filters.status).toEqual(["pending"]);
  });

  it("returns types to lectures only", () => {
    const withEveryType = after(
      [{ type: "filterValuesRemoved", facet: "component", values: ["LEC"] }],
      withHistory,
    );

    const state = after([{ type: "historyToggled" }], withEveryType);

    expect(state.filters.component).toEqual(["LEC"]);
  });

  it("closes an open section", () => {
    expect(withoutHistory.selection).toBeNull();
  });

  it("returns a section facet's list to people", () => {
    expect(withoutHistory.activeFacet).toBe("person");
  });

  it("keeps an open leave", () => {
    const state = after(
      [{ type: "leaveSelected", leaveId: 7 }, { type: "historyToggled" }],
      withHistory,
    );

    expect(state.selection).toEqual({ kind: "leave", leaveId: 7 });
  });
});

describe("filters", () => {
  it("adds a value once however often it is checked", () => {
    const state = after([
      { type: "filterValuesAdded", facet: "person", values: ["1"] },
      { type: "filterValuesAdded", facet: "person", values: ["1", "2"] },
    ]);

    expect(state.filters.person).toEqual(["1", "2"]);
  });

  it("opens history on lectures only", () => {
    const state = after([{ type: "historyToggled" }]);

    expect(state.filters.component).toEqual(["LEC"]);
  });

  it("clears every facet at once, types included", () => {
    const state = after([
      { type: "historyToggled" },
      { type: "filterValuesAdded", facet: "person", values: ["1"] },
      { type: "filterValuesAdded", facet: "status", values: ["pending"] },
      { type: "filtersCleared" },
    ]);

    expect(Object.values(state.filters).flat()).toEqual([]);
  });
});
