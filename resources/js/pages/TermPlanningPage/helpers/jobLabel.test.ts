import { describe, expect, it } from "vitest";
import {
  costAssumptions,
  costPerson,
  jobCodeRate,
} from "./costAssumptions.fixture";
import { jobLabelerOf } from "./jobLabel";

describe("jobLabelerOf", () => {
  const jobLabelOf = jobLabelerOf(
    costAssumptions({
      jobCodeRates: [jobCodeRate("9403", 0)],
      people: [
        costPerson(1, ["9403"]),
        costPerson(2, ["9755"], { "9755": "Research Specialist" }),
        costPerson(3, ["9996"]),
      ],
    }),
  );

  it("labels a catalogued job code with its title", () => {
    expect(jobLabelOf(1)).toBe("9403 · Title 9403");
  });

  it("falls back to the SIS position title for an uncatalogued code", () => {
    expect(jobLabelOf(2)).toBe("9755 · Research Specialist");
  });

  it("shows the code alone when neither has a title", () => {
    expect(jobLabelOf(3)).toBe("9996");
  });

  it("is null for someone with no job code", () => {
    expect(jobLabelOf(4)).toBeNull();
  });
});
