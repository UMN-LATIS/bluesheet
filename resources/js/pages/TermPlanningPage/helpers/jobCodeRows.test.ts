import { describe, expect, it } from "vitest";
import {
  costAssumptions,
  costPerson,
  jobCodeRate,
} from "./costAssumptions.fixture";
import { jobCodeRowsOf, rateNoteOf } from "./jobCodeRows";

describe("jobCodeRowsOf", () => {
  const assumptions = costAssumptions({
    jobCodes: [
      jobCodeRate("A", 4000, { source: "2027 table" }),
      jobCodeRate("T", null, { instructorType: "teaching_assistant" }),
    ],
    people: [
      costPerson(1, ["B", "A"]),
      costPerson(2, ["T"]),
      costPerson(3, ["Z"]),
    ],
  });

  it("lists only the codes of people teaching this term, sorted", () => {
    const rows = jobCodeRowsOf(assumptions, new Set([1, 2]));

    expect(rows.map(({ code }) => code)).toEqual(["A", "B", "T"]);
  });

  it("lists a code missing from the job code list as unrated", () => {
    const [, unlisted] = jobCodeRowsOf(assumptions, new Set([1]));

    expect(unlisted).toEqual({
      code: "B",
      title: "Not in the job code list",
      instructorTypeLabel: "",
      costPerCourse: null,
      isPricedPerAppointment: false,
      note: "Costs the unrated job code amount below",
    });
  });

  it("labels the instructor type and shows the rate source", () => {
    const [row] = jobCodeRowsOf(assumptions, new Set([1]));

    expect(row).toMatchObject({
      code: "A",
      instructorTypeLabel: "Contract / visiting",
      costPerCourse: 4000,
      isPricedPerAppointment: false,
      note: "2027 table",
    });
  });

  it("prices a TA job code per appointment", () => {
    const [row] = jobCodeRowsOf(assumptions, new Set([2]));

    expect(row.isPricedPerAppointment).toBe(true);
  });
});

describe("rateNoteOf", () => {
  it("says which earlier year a rate is carried from", () => {
    const rate = jobCodeRate("A", 4000, { rateFiscalYear: 2026 });

    expect(rateNoteOf(rate, 2027)).toBe("FY26 rate · FY27 not entered yet");
  });

  it("is empty for a current rate with no source", () => {
    expect(rateNoteOf(jobCodeRate("A", 4000), 2027)).toBe("");
  });
});
