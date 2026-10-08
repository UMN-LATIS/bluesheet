import { describe, expect, it } from "vitest";
import {
  costOfLeadInstructor,
  costOfTaAppointment,
  costRuleSettingsOf,
  isFreeComponent,
  pricingOf,
} from "./costRules";
import {
  costRuleSettings,
  costSetting,
  jobCodeRate,
  personChoice,
  taAppointmentRate,
} from "./costAssumptions.fixture";

const serverSettings = [
  costSetting("unstaffedSectionCost", 5000),
  costSetting("unratedJobCodeCost", 7000),
  costSetting("taAppointmentPercent", 25),
  costSetting("isRecurringBudgetFree", true),
  costSetting("isIndependentStudyFree", false),
  costSetting("isFieldworkFree", false),
];

const ratesOf = (...rates: ReturnType<typeof jobCodeRate>[]) =>
  new Map(rates.map((rate) => [rate.code, rate]));

describe("costRuleSettingsOf", () => {
  it("reads every rule from the server rows", () => {
    expect(costRuleSettingsOf(serverSettings, {})).toEqual({
      unstaffedSectionCost: 5000,
      unratedJobCodeCost: 7000,
      taAppointmentPercent: 25,
      isRecurringBudgetFree: true,
      isIndependentStudyFree: false,
      isFieldworkFree: false,
    });
  });

  it("uses a pending non-null edit over the server value", () => {
    const settings = costRuleSettingsOf(serverSettings, {
      unstaffedSectionCost: 9000,
      isRecurringBudgetFree: false,
    });

    expect(settings.unstaffedSectionCost).toBe(9000);
    expect(settings.isRecurringBudgetFree).toBe(false);
  });

  it("uses a pending zero edit rather than the server value", () => {
    expect(
      costRuleSettingsOf(serverSettings, { unstaffedSectionCost: 0 })
        .unstaffedSectionCost,
    ).toBe(0);
  });

  it("falls back to the server value on a pending null edit", () => {
    expect(
      costRuleSettingsOf(serverSettings, { unstaffedSectionCost: null })
        .unstaffedSectionCost,
    ).toBe(5000);
  });

  it("throws when the server sent no row for a key", () => {
    const withoutUnrated = serverSettings.filter(
      ({ key }) => key !== "unratedJobCodeCost",
    );

    expect(() => costRuleSettingsOf(withoutUnrated, {})).toThrow(
      "No cost setting is named unratedJobCodeCost",
    );
  });
});

describe("isFreeComponent", () => {
  it("makes IND free when the independent study toggle is on", () => {
    expect(
      isFreeComponent("IND", costRuleSettings({ isIndependentStudyFree: true })),
    ).toBe(true);
  });

  it("charges IND when the independent study toggle is off", () => {
    expect(isFreeComponent("IND", costRuleSettings())).toBe(false);
  });

  it("makes FWK free only by the fieldwork toggle", () => {
    expect(
      isFreeComponent("FWK", costRuleSettings({ isIndependentStudyFree: true })),
    ).toBe(false);
    expect(
      isFreeComponent("FWK", costRuleSettings({ isFieldworkFree: true })),
    ).toBe(true);
  });

  it("never makes LEC free", () => {
    expect(
      isFreeComponent(
        "LEC",
        costRuleSettings({ isIndependentStudyFree: true, isFieldworkFree: true }),
      ),
    ).toBe(false);
  });
});

describe("pricingOf", () => {
  const rates = ratesOf(jobCodeRate("A", 4000), jobCodeRate("B", 6000));

  it("uses the job code the planner picked even when another pays more", () => {
    const pricing = pricingOf(["A", "B"], personChoice(1, { jobCode: "A" }), rates);

    expect(pricing.jobCode).toBe("A");
    expect(pricing.chosenBy).toBe("planner");
  });

  it("picks the held job code with the highest cost per course", () => {
    const pricing = pricingOf(["A", "B"], undefined, rates);

    expect(pricing.jobCode).toBe("B");
    expect(pricing.chosenBy).toBe("highestRate");
  });

  it("prefers a rated code over an unrated one", () => {
    expect(pricingOf(["X", "A"], undefined, rates).jobCode).toBe("A");
  });

  it("treats a code with a null cost as unrated, so a rated code wins", () => {
    const withNullRate = ratesOf(jobCodeRate("N", null), jobCodeRate("A", 4000));

    expect(pricingOf(["N", "A"], undefined, withNullRate).jobCode).toBe("A");
  });

  it("has no job code when the person holds none", () => {
    const pricing = pricingOf([], undefined, rates);

    expect(pricing.jobCode).toBeNull();
    expect(pricing.rate).toBeNull();
    expect(pricing.jobCodeCount).toBe(0);
  });

  it("counts every held job code", () => {
    expect(pricingOf(["A", "B", "X"], undefined, rates).jobCodeCount).toBe(3);
  });

  it("takes the instructor type from the planner's choice first", () => {
    const pricing = pricingOf(
      ["A"],
      personChoice(1, { instructorType: "pa_instructor" }),
      rates,
    );

    expect(pricing.instructorType).toBe("pa_instructor");
  });

  it("takes the instructor type from the job code's rate row otherwise", () => {
    const recurring = ratesOf(
      jobCodeRate("R", 0, { instructorType: "recurring_budget_pa" }),
    );

    expect(pricingOf(["R"], undefined, recurring).instructorType).toBe(
      "recurring_budget_pa",
    );
  });

  it("has no instructor type when the job code is unrated and none was chosen", () => {
    expect(pricingOf(["X"], undefined, rates).instructorType).toBeNull();
  });

  it("defaults the student status to regular", () => {
    expect(pricingOf(["A"], undefined, rates).studentStatus).toBe("regular");
  });

  it("uses the student status the planner chose", () => {
    expect(
      pricingOf(["A"], personChoice(1, { studentStatus: "abd" }), rates)
        .studentStatus,
    ).toBe("abd");
  });

  it("carries the override cost and reason", () => {
    const pricing = pricingOf(
      ["A"],
      personChoice(1, { overrideCost: 0, overrideReason: "Grant" }),
      rates,
    );

    expect(pricing.overrideCost).toBe(0);
    expect(pricing.overrideReason).toBe("Grant");
  });
});

describe("costOfLeadInstructor", () => {
  const rates = ratesOf(
    jobCodeRate("A", 4000),
    jobCodeRate("R", 8000, { instructorType: "recurring_budget_faculty" }),
    jobCodeRate("P", 3000, { instructorType: "recurring_budget_pa" }),
  );

  it("uses an override of zero over a job code rate", () => {
    const pricing = pricingOf(
      ["A"],
      personChoice(1, { overrideCost: 0, overrideReason: "Grant" }),
      rates,
    );

    expect(costOfLeadInstructor(pricing, costRuleSettings())).toEqual({
      amount: 0,
      basis: { kind: "override", reason: "Grant" },
    });
  });

  it("uses an override over the free recurring budget rule", () => {
    const pricing = pricingOf(["R"], personChoice(1, { overrideCost: 1234 }), rates);
    const settings = costRuleSettings({ isRecurringBudgetFree: true });

    expect(costOfLeadInstructor(pricing, settings).amount).toBe(1234);
  });

  it("costs recurring budget faculty nothing when the toggle is on", () => {
    const line = costOfLeadInstructor(
      pricingOf(["R"], undefined, rates),
      costRuleSettings({ isRecurringBudgetFree: true }),
    );

    expect(line).toEqual({
      amount: 0,
      basis: { kind: "recurringBudget", instructorType: "recurring_budget_faculty" },
    });
  });

  it("costs recurring budget P&A nothing when the toggle is on", () => {
    const line = costOfLeadInstructor(
      pricingOf(["P"], undefined, rates),
      costRuleSettings({ isRecurringBudgetFree: true }),
    );

    expect(line.amount).toBe(0);
    expect(line.basis.kind).toBe("recurringBudget");
  });

  it("costs recurring budget faculty their job code rate when the toggle is off", () => {
    const line = costOfLeadInstructor(
      pricingOf(["R"], undefined, rates),
      costRuleSettings({ isRecurringBudgetFree: false }),
    );

    expect(line.amount).toBe(8000);
    expect(line.basis.kind).toBe("jobCodeRate");
  });

  it("costs a non-recurring person their job code rate even when the toggle is on", () => {
    const line = costOfLeadInstructor(
      pricingOf(["A"], undefined, rates),
      costRuleSettings({ isRecurringBudgetFree: true }),
    );

    expect(line.amount).toBe(4000);
  });

  it("records the rate, its fiscal year, and how the code was chosen", () => {
    const line = costOfLeadInstructor(
      pricingOf(["A", "R"], undefined, rates),
      costRuleSettings(),
    );

    expect(line).toEqual({
      amount: 8000,
      basis: {
        kind: "jobCodeRate",
        jobCode: "R",
        title: "Title R",
        rateFiscalYear: 2027,
        chosenBy: "highestRate",
        jobCodeCount: 2,
      },
    });
  });

  it("costs the unrated job code cost when the code has no rate row", () => {
    const line = costOfLeadInstructor(
      pricingOf(["X"], undefined, rates),
      costRuleSettings(),
    );

    expect(line).toEqual({
      amount: 7000,
      basis: { kind: "unratedJobCode", jobCode: "X" },
    });
  });

  it("costs the unrated job code cost when the rate row has a null cost", () => {
    const nullRate = ratesOf(jobCodeRate("N", null));

    expect(
      costOfLeadInstructor(pricingOf(["N"], undefined, nullRate), costRuleSettings())
        .amount,
    ).toBe(7000);
  });

  it("costs the unrated job code cost with a null job code when the person holds none", () => {
    const line = costOfLeadInstructor(
      pricingOf([], undefined, rates),
      costRuleSettings(),
    );

    expect(line).toEqual({
      amount: 7000,
      basis: { kind: "unratedJobCode", jobCode: null },
    });
  });
});

describe("costOfTaAppointment", () => {
  const taRates = [
    taAppointmentRate(9000),
    taAppointmentRate(9500, { studentStatus: "abd" }),
    taAppointmentRate(8000, { season: "spring" }),
    taAppointmentRate(18000, { appointmentPercent: 50 }),
  ];
  const regular = pricingOf([], undefined, new Map());
  const abd = pricingOf([], personChoice(1, { studentStatus: "abd" }), new Map());

  it("uses an override over any appointment rate", () => {
    const pricing = pricingOf([], personChoice(1, { overrideCost: 0 }), new Map());

    expect(
      costOfTaAppointment(pricing, costRuleSettings(), "fall", taRates, 2027)
        .amount,
    ).toBe(0);
  });

  it("matches the season, regular status, and appointment percent", () => {
    expect(
      costOfTaAppointment(regular, costRuleSettings(), "fall", taRates, 2027),
    ).toEqual({
      amount: 9000,
      basis: {
        kind: "taAppointment",
        appointmentPercent: 25,
        season: "fall",
        studentStatus: "regular",
        rateFiscalYear: 2027,
      },
    });
  });

  it("uses the ABD row for an ABD student", () => {
    expect(
      costOfTaAppointment(abd, costRuleSettings(), "fall", taRates, 2027).amount,
    ).toBe(9500);
  });

  it("uses the row for the term's season", () => {
    expect(
      costOfTaAppointment(regular, costRuleSettings(), "spring", taRates, 2027)
        .amount,
    ).toBe(8000);
  });

  it("uses the row for the configured appointment percent", () => {
    const settings = costRuleSettings({ taAppointmentPercent: 50 });

    expect(
      costOfTaAppointment(regular, settings, "fall", taRates, 2027).amount,
    ).toBe(18000);
  });

  it("returns a null amount with noTaRate when the percent has no row", () => {
    const settings = costRuleSettings({ taAppointmentPercent: 33 });

    expect(costOfTaAppointment(regular, settings, "fall", taRates, 2027)).toEqual({
      amount: null,
      basis: {
        kind: "noTaRate",
        appointmentPercent: 33,
        season: "fall",
        studentStatus: "regular",
      },
    });
  });

  it("returns a null amount when only the other status has a row for that season", () => {
    const line = costOfTaAppointment(abd, costRuleSettings(), "spring", taRates, 2027);

    expect(line.amount).toBeNull();
    expect(line.basis.kind).toBe("noTaRate");
  });
});
