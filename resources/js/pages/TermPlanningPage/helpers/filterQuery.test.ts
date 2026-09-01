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

  it("decodes an array value and a comma string the same way", () => {
    const fromArray = decodeFilters({ course: ["ANTH-1001", "HIST-1082"] });
    const fromCommaString = decodeFilters({
      course: "ANTH-1001,HIST-1082",
    });

    expect(fromArray).toEqual(fromCommaString);
    expect(fromArray.course).toEqual(["ANTH-1001", "HIST-1082"]);
  });

  it("ignores keys that are not facets", () => {
    expect(decodeFilters({ term: "1269", course: "ANTH-1001" })).toEqual({
      ...emptyFilters(),
      course: ["ANTH-1001"],
    });
  });

  it("drops empty strings and nulls", () => {
    expect(
      decodeFilters({ course: ["ANTH-1001", "", null, "HIST-1082"] }),
    ).toEqual({
      ...emptyFilters(),
      course: ["ANTH-1001", "HIST-1082"],
    });
  });
});
