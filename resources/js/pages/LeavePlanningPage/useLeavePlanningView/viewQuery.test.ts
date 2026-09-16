import { describe, expect, it } from "vitest";
import { decodeViewQuery, encodeViewQuery } from "./viewQuery";

describe("the view query", () => {
  it("round-trips every key it owns", () => {
    const query = {
      start: "1263",
      end: "1273",
      history: "1",
      view: "courses",
      person: "12,34",
      category: "Faculty",
      leaveType: "sabbatical",
      status: "pending",
      course: "ANTH-1001",
      component: "LEC,LAB",
      leaveId: "9",
    };

    expect(encodeViewQuery(decodeViewQuery(query))).toEqual(query);
  });

  it("writes nothing for the defaults", () => {
    expect(encodeViewQuery(decodeViewQuery({}))).toEqual({});
    expect(encodeViewQuery(decodeViewQuery({ history: "1" }))).toEqual({
      history: "1",
    });
  });

  it("reads a missing type list as lectures and an empty one as every type", () => {
    expect(decodeViewQuery({}).filters.component).toEqual(["LEC"]);

    const query = { history: "1", component: "" };
    expect(decodeViewQuery(query).filters.component).toEqual([]);
    expect(encodeViewQuery(decodeViewQuery(query))).toEqual(query);
  });

  it("ignores a term, view, or leave it cannot read", () => {
    const state = decodeViewQuery({
      start: "fall",
      end: "-3",
      view: "gantt",
      leaveId: "0",
    });

    expect(state.range).toEqual({ startTermId: null, endTermId: null });
    expect(state.view).toBe("instructors");
    expect(state.selection).toBeNull();
  });

  it("drops empty and repeated filter values", () => {
    expect(decodeViewQuery({ person: "12,,12,34," }).filters.person).toEqual([
      "12",
      "34",
    ]);
  });
});
