import { describe, expect, it } from "vitest";
import { personRow, unstaffedRow } from "./personRow.fixture";
import { tenureTrackRowsOf } from "./tenureTrackRows";

describe("tenureTrackRowsOf", () => {
  it("keeps only recurring budget faculty", () => {
    const { rows } = tenureTrackRowsOf([
      personRow({ emplid: 1 }),
      personRow({ emplid: 2, instructorType: "pa_instructor" }),
      personRow({ emplid: 3, instructorType: null }),
      unstaffedRow(),
    ]);

    expect(rows.map(({ emplid }) => emplid)).toEqual([1]);
  });

  it("counts releases toward the expected load", () => {
    const { rows } = tenureTrackRowsOf([
      personRow({
        emplid: 1,
        paidSectionCount: 1,
        courseReleases: 1,
        expectedSectionCount: 2,
      }),
      personRow({ emplid: 2, paidSectionCount: 1, expectedSectionCount: 3 }),
      personRow({ emplid: 3, paidSectionCount: 3, expectedSectionCount: 2 }),
      personRow({ emplid: 4, paidSectionCount: 3, expectedSectionCount: null }),
    ]);

    expect(rows.map(({ mismatchLabel }) => mismatchLabel)).toEqual([
      null,
      "2 short",
      "1 over",
      null,
    ]);
  });

  it("totals people, releases, expected, and listed sections", () => {
    const { totals } = tenureTrackRowsOf([
      personRow({
        emplid: 1,
        paidSectionCount: 1,
        courseReleases: 1,
        expectedSectionCount: 2,
      }),
      personRow({
        emplid: 2,
        isAssigned: false,
        paidSectionCount: 0,
        expectedSectionCount: 2,
      }),
    ]);

    expect(totals).toEqual({ count: 2, releases: 1, expected: 4, listed: 1 });
  });
});
