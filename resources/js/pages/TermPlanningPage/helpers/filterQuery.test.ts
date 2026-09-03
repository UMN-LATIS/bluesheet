import { describe, expect, it } from "vitest";
import { decodeFilters, encodeFilters } from "./filterQuery";
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

  it("omits empty facets, so no filters encode to {}", () => {
    expect(encodeFilters(emptyFilters())).toEqual({});
  });
});

describe("decodeFilters", () => {
  it("decodes an empty query to emptyFilters", () => {
    expect(decodeFilters({})).toEqual(emptyFilters());
  });

  it("splits a comma-joined value back into its own facet", () => {
    expect(decodeFilters({ course: "ANTH-1001,HIST-1082" }).course).toEqual([
      "ANTH-1001",
      "HIST-1082",
    ]);
  });

  it("ignores keys that are not facets", () => {
    expect(decodeFilters({ term: "1269", course: "ANTH-1001" })).toEqual({
      ...emptyFilters(),
      course: ["ANTH-1001"],
    });
  });

  it("drops the empty stretches a stray comma leaves behind", () => {
    expect(decodeFilters({ course: "ANTH-1001,,HIST-1082," })).toEqual({
      ...emptyFilters(),
      course: ["ANTH-1001", "HIST-1082"],
    });
  });
});
