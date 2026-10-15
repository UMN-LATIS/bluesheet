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

  it("totals people, releases, load, and cost", () => {
    const { totals } = tenureTrackRowsOf([
      personRow({
        emplid: 1,
        paidSectionCount: 1,
        courseReleases: 1,
        total: 0,
      }),
      personRow({
        emplid: 2,
        isAssigned: false,
        paidSectionCount: 0,
        total: 250,
      }),
    ]);

    expect(totals).toEqual({ count: 2, releases: 1, load: 1, cost: 250 });
  });
});
