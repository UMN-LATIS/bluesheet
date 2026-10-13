import { describe, expect, it } from "vitest";
import { describeCostBasis, type CostBasis } from "./costBasis";

const labelOfSection = (sectionId: number) => `Section #${sectionId}`;
const describe_ = (basis: CostBasis) =>
  describeCostBasis(basis, labelOfSection);

const jobCodeRateBasis = (
  extra: Partial<Extract<CostBasis, { kind: "jobCodeRate" }>> = {},
): CostBasis => ({
  kind: "jobCodeRate",
  jobCode: "9754",
  title: "Teaching Specialist",
  rateFiscalYear: 2027,
  jobCodeCount: 1,
  ...extra,
});

describe("describeCostBasis", () => {
  it("names a line override, the amount it replaced, and its reason", () => {
    expect(
      describe_({
        kind: "lineOverride",
        reason: "Grant funded",
        replacedAmount: 10000,
      }),
    ).toBe("Changed for this section, was $10,000 · Grant funded");
  });

  it("names a line override that replaced a line with no rate", () => {
    expect(
      describe_({ kind: "lineOverride", reason: null, replacedAmount: null }),
    ).toBe("Changed for this section, was no rate");
  });

  it("names a free component by its label", () => {
    expect(describe_({ kind: "freeComponent", component: "IND" })).toBe(
      "Independent study · no added cost",
    );
    expect(describe_({ kind: "freeComponent", component: "FWK" })).toBe(
      "Fieldwork · no added cost",
    );
  });

  it("falls back to the raw code for an unlabeled free component", () => {
    expect(describe_({ kind: "freeComponent", component: "SEM" })).toBe(
      "SEM · no added cost",
    );
  });

  it("names a section paid on its course's lecture", () => {
    expect(
      describe_({
        kind: "paidOnLecture",
        component: "LAB",
        lectureSectionId: 3,
      }),
    ).toBe("Lab in a course with a lecture · paid on Section #3");
    expect(
      describe_({
        kind: "paidOnLecture",
        component: "DIS",
        lectureSectionId: 3,
      }),
    ).toBe("Discussion in a course with a lecture · paid on Section #3");
  });

  it("describes a job code rate with a two digit fiscal year", () => {
    expect(describe_(jobCodeRateBasis())).toBe(
      "9754 Teaching Specialist · FY27 rate",
    );
  });

  it("adds the job code count when the person holds several", () => {
    expect(describe_(jobCodeRateBasis({ jobCodeCount: 3 }))).toBe(
      "9754 Teaching Specialist · FY27 rate · highest of 3 job codes",
    );
  });

  it("names a rate the planner changed for the term", () => {
    expect(
      describe_(jobCodeRateBasis({ title: null, rateFiscalYear: null })),
    ).toBe("9754 · rate changed for this term");
  });

  it("names an unrated job code", () => {
    expect(describe_({ kind: "unratedJobCode", jobCode: "1234" })).toBe(
      "1234 has no rate · Unstaffed rate",
    );
  });

  it("explains an unrated person with no job code", () => {
    expect(describe_({ kind: "unratedJobCode", jobCode: null })).toBe(
      "No job code in this department · Unstaffed rate",
    );
  });

  it("describes an unstaffed section", () => {
    expect(describe_({ kind: "unstaffedSection" })).toBe(
      "No instructor yet · Unstaffed rate",
    );
  });

  it("describes a TA appointment with its rate year", () => {
    expect(
      describe_({
        kind: "taAppointment",
        appointmentPercent: 25,
        season: "fall",
        studentStatus: "abd",
        rateFiscalYear: 2027,
      }),
    ).toBe("25% ABD TA, fall · FY27 rate");
  });

  it("describes a TA appointment at the term's rate", () => {
    expect(
      describe_({
        kind: "taAppointment",
        appointmentPercent: 50,
        season: "spring",
        studentStatus: "regular",
        rateFiscalYear: null,
      }),
    ).toBe("50% regular TA, spring · rate changed for this term");
  });

  it("says which TA rate is missing", () => {
    expect(
      describe_({
        kind: "noTaRate",
        appointmentPercent: 25,
        season: "summer",
        studentStatus: "abd",
      }),
    ).toBe("No 25% ABD summer TA rate entered");
  });

  it("names the section that carries a covered TA appointment", () => {
    expect(describe_({ kind: "chargedOnOtherSection", sectionId: 12 })).toBe(
      "Counted on Section #12",
    );
  });
});
