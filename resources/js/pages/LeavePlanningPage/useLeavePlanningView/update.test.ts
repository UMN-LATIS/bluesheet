import { describe, expect, it } from "vitest";
import { initialState, update } from "./update";
import { leaveStatuses, leaveTypes } from "@/types";
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

const savedDraft = {
  emplid: 900,
  description: "Fieldwork",
  type: leaveTypes.SABBATICAL,
  status: leaveStatuses.CONFIRMED,
  startDate: "2026-09-01",
  endDate: "2026-12-31",
};

describe("the editor", () => {
  const openOnLeave = (leaveId: number) =>
    after([{ type: "leaveSelected", leaveId }]);

  const editing = (leaveId = 7) =>
    after([{ type: "editRequested", draft: savedDraft }], openOnLeave(leaveId));

  it("opens a selected leave for editing with the values it was given", () => {
    const state = editing(7);

    expect(state.editor).toEqual({
      kind: "editingLeave",
      leaveId: 7,
      draft: savedDraft,
      openedDraft: savedDraft,
    });
  });

  it("refuses to edit when no leave is selected", () => {
    const state = after([{ type: "editRequested", draft: savedDraft }]);

    expect(state.editor).toBeNull();
  });

  it("opens a new leave on the dates the click named", () => {
    const state = after([
      {
        type: "creationRequested",
        emplid: 42,
        startDate: "2026-08-31",
        endDate: "2027-01-13",
      },
    ]);

    expect(state.editor?.kind).toBe("creatingLeave");
    expect(state.editor?.draft.emplid).toBe(42);
    expect(state.editor?.draft.startDate).toBe("2026-08-31");
    expect(state.selection).toBeNull();
  });

  it("keeps the untouched values as the baseline while the draft changes", () => {
    const state = after(
      [{ type: "draftEdited", change: { description: "Sabbatical" } }],
      editing(7),
    );

    expect(state.editor?.draft.description).toBe("Sabbatical");
    expect(state.editor?.openedDraft.description).toBe("Fieldwork");
  });

  it("selects the created leave once the server has it", () => {
    const state = after(
      [
        { type: "draftEdited", change: { description: "New" } },
        { type: "leavePersisted", leaveId: 31 },
      ],
      after([
        {
          type: "creationRequested",
          emplid: 42,
          startDate: "2026-08-31",
          endDate: "2027-01-13",
        },
      ]),
    );

    expect(state.selection).toEqual({ kind: "leave", leaveId: 31 });
    expect(state.editor).toBeNull();
  });

  it("clears the panel after a delete", () => {
    const state = after([{ type: "leaveDeleted" }], editing(7));

    expect(state.selection).toBeNull();
    expect(state.editor).toBeNull();
  });
});

describe("discarding an unsaved draft", () => {
  const dirtyEditorOn = (leaveId: number) => {
    return after(
      [
        { type: "editRequested", draft: savedDraft },
        { type: "draftEdited", change: { description: "Changed" } },
      ],
      after([{ type: "leaveSelected", leaveId }]),
    );
  };

  it("holds a selection change rather than dropping the draft", () => {
    const state = after(
      [{ type: "leaveSelected", leaveId: 9 }],
      dirtyEditorOn(7),
    );

    expect(state.pendingDismissal).toEqual({
      type: "leaveSelected",
      leaveId: 9,
    });
    expect(state.selection).toEqual({ kind: "leave", leaveId: 7 });
    expect(state.editor?.draft.description).toBe("Changed");
  });

  it("lets an untouched draft go without asking", () => {
    const state = after(
      [
        { type: "editRequested", draft: savedDraft },
        { type: "leaveSelected", leaveId: 9 },
      ],
      after([{ type: "leaveSelected", leaveId: 7 }]),
    );

    expect(state.pendingDismissal).toBeNull();
    expect(state.selection).toEqual({ kind: "leave", leaveId: 9 });
  });

  it("keeps the draft exactly as it was when the reader backs out", () => {
    const held = dirtyEditorOn(7);
    const asked = after([{ type: "leaveSelected", leaveId: 9 }], held);
    const state = after([{ type: "dismissalCancelled" }], asked);

    expect(state.pendingDismissal).toBeNull();
    expect(state.editor).toEqual(held.editor);
    expect(state.selection).toEqual({ kind: "leave", leaveId: 7 });
  });

  it("runs the held event and writes its URL once the reader confirms", () => {
    const asked = after(
      [{ type: "leaveSelected", leaveId: 9 }],
      dirtyEditorOn(7),
    );
    const { state, effects } = update(asked, { type: "dismissalConfirmed" });

    expect(state.selection).toEqual({ kind: "leave", leaveId: 9 });
    expect(state.editor).toBeNull();
    expect(state.pendingDismissal).toBeNull();
    expect(effects).toEqual([
      { type: "replaceUrlQuery", query: { leaveId: "9" } },
    ]);
  });
});
