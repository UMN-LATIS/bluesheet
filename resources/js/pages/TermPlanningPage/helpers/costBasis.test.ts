import { describe, expect, it } from "vitest";
import { describeCostBasis, type CostBasis } from "./costBasis";

const labelOfSection = (sectionId: number) => `Section #${sectionId}`;
const describe_ = (basis: CostBasis) => describeCostBasis(basis, labelOfSection);

const jobCodeRateBasis = (
  extra: Partial<Extract<CostBasis, { kind: "jobCodeRate" }>> = {},
): CostBasis => ({
  kind: "jobCodeRate",
  jobCode: "9754",
  title: "Teaching Specialist",
  rateFiscalYear: 2027,
  chosenBy: "planner",
  jobCodeCount: 1,
  ...extra,
});

describe("describeCostBasis", () => {
  it("names an override and its reason", () => {
    expect(describe_({ kind: "override", reason: "Grant funded" })).toBe(
      "Override: Grant funded",
    );
  });

  it("names an override without a reason", () => {
    expect(describe_({ kind: "override", reason: null })).toBe("Override");
  });

  it("names the recurring budget type", () => {
    expect(
      describe_({ kind: "recurringBudget", instructorType: "recurring_budget_pa" }),
    ).toBe("Recurring budget P&A · no added cost");
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
    expect(describe_({ kind: "paidOnLecture", component: "LAB" })).toBe(
      "Lab in a course with a lecture · paid on the lecture",
    );
    expect(describe_({ kind: "paidOnLecture", component: "DIS" })).toBe(
      "Discussion in a course with a lecture · paid on the lecture",
    );
  });

  it("describes a job code rate with a two digit fiscal year", () => {
    expect(describe_(jobCodeRateBasis())).toBe(
      "9754 Teaching Specialist · FY27 rate",
    );
  });

  it("adds the job code count when the highest rate of several was chosen", () => {
    expect(
      describe_(jobCodeRateBasis({ chosenBy: "highestRate", jobCodeCount: 3 })),
    ).toBe("9754 Teaching Specialist · FY27 rate · highest of 3 job codes");
  });

  it("omits the job code count when the highest rate of one code was chosen", () => {
    expect(
      describe_(jobCodeRateBasis({ chosenBy: "highestRate", jobCodeCount: 1 })),
    ).toBe("9754 Teaching Specialist · FY27 rate");
  });

  it("omits the job code count when the planner chose among several", () => {
    expect(
      describe_(jobCodeRateBasis({ chosenBy: "planner", jobCodeCount: 3 })),
    ).toBe("9754 Teaching Specialist · FY27 rate");
  });

  it("names an unrated job code", () => {
    expect(describe_({ kind: "unratedJobCode", jobCode: "1234" })).toBe(
      "1234 has no rate · unrated job code cost",
    );
  });

  it("explains an unrated person with no job code", () => {
    expect(describe_({ kind: "unratedJobCode", jobCode: null })).toBe(
      "No job code in this department · unrated job code cost",
    );
  });

  it("describes an unstaffed section", () => {
    expect(describe_({ kind: "unstaffedSection" })).toBe(
      "No instructor yet · unstaffed section cost",
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

  it("describes a TA appointment without a rate year", () => {
    expect(
      describe_({
        kind: "taAppointment",
        appointmentPercent: 50,
        season: "spring",
        studentStatus: "regular",
        rateFiscalYear: null,
      }),
    ).toBe("50% regular TA, spring");
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
