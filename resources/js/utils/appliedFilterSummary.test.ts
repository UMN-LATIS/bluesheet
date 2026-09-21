import { describe, expect, it } from "vitest";
import { summarizeAppliedFilters } from "./appliedFilterSummary";
import type { AppliedFilter } from "./appliedFilterSummary";

const applied = (values: string[]): AppliedFilter => ({
  values,
});

describe("summarizeAppliedFilters", () => {
  it("says nothing when nothing is filtered", () => {
    expect(summarizeAppliedFilters([])).toBe("");
  });

  it("names the values rather than counting them", () => {
    expect(summarizeAppliedFilters([applied(["Confirmed"])])).toBe("Confirmed");
  });

  it("runs facets together, since the reader can tell them apart", () => {
    expect(
      summarizeAppliedFilters([applied(["Confirmed"]), applied(["Faculty"])]),
    ).toBe("Confirmed · Faculty");
  });

  it("keeps a name holding a comma from reading as two values", () => {
    expect(
      summarizeAppliedFilters([applied(["Olsen, Mallory", "Sackett, Paul"])]),
    ).toBe("Olsen, Mallory · Sackett, Paul");
  });

  it("counts what it had to cut", () => {
    const summary = summarizeAppliedFilters([
      applied([
        "Olsen, Mallory",
        "Sackett, Paul",
        "Hakyemez, Serra",
        "Madani, Rania",
        "Okafor, Ngozi",
      ]),
    ]);

    expect(summary).toBe(
      "Olsen, Mallory · Sackett, Paul · Hakyemez, Serra · +2 more",
    );
  });

  it("shows one value even when it alone overruns the rail", () => {
    const long = "A".repeat(80);

    expect(summarizeAppliedFilters([applied([long, "Faculty"])])).toBe(
      `${long} · +1 more`,
    );
  });
});
