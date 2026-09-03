import { describe, expect, it } from "vitest";
import { decodeFilters, defaultFilters, encodeFilters } from "./filterQuery";
import { emptyFilters } from "../useScheduleEditor/update";
import type { ScheduleFilters } from "../types";

describe("encodeFilters", () => {
  it("round-trips through decodeFilters", () => {
    const filters: ScheduleFilters = {
      course: ["ANTH-1001", "HIST-1082"],
      person: ["111"],
      section: [],
      component: ["LEC"],
    };

    expect(decodeFilters(encodeFilters(filters))).toEqual(filters);
  });

  it("omits empty facets, but writes an empty component", () => {
    expect(encodeFilters(emptyFilters())).toEqual({ component: "" });
  });

  it("round-trips every type checked off, which is not the default", () => {
    expect(decodeFilters(encodeFilters(emptyFilters()))).toEqual(
      emptyFilters(),
    );
  });
});

describe("decodeFilters", () => {
  it("decodes an empty query to the lectures the page opens on", () => {
    expect(decodeFilters({})).toEqual(defaultFilters());
    expect(defaultFilters().component).toEqual(["LEC"]);
  });

  it("splits a comma-joined value back into its own facet", () => {
    expect(decodeFilters({ course: "ANTH-1001,HIST-1082" }).course).toEqual([
      "ANTH-1001",
      "HIST-1082",
    ]);
  });

  it("ignores keys that are not facets", () => {
    expect(decodeFilters({ term: "1269", course: "ANTH-1001" })).toEqual({
      ...defaultFilters(),
      course: ["ANTH-1001"],
    });
  });

  it("drops the empty stretches a stray comma leaves behind", () => {
    expect(decodeFilters({ course: "ANTH-1001,,HIST-1082," })).toEqual({
      ...defaultFilters(),
      course: ["ANTH-1001", "HIST-1082"],
    });
  });
});
