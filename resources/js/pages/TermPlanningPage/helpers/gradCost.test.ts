import { describe, expect, it } from "vitest";
import {
  costAssumptions,
  FALL_GRAD_INPUTS,
  FALL_GRAD_LEVELS,
  gradRates,
  rateOverrides,
} from "./costAssumptions.fixture";
import {
  appointmentPercentOfSection,
  gradCostOf,
  hoursOfAppointment,
  gradTermOf,
  offsetShareOf,
  type GradStudent,
  type GradTerm,
} from "./gradCost";

const fallTerm: GradTerm = {
  inputs: FALL_GRAD_INPUTS,
  hoursByAppointmentPercent: new Map(
    FALL_GRAD_LEVELS.map(({ appointmentPercent, hours }) => [
      appointmentPercent,
      hours,
    ]),
  ),
};

const student = (extra: Partial<GradStudent> = {}): GradStudent => ({
  appointmentPercent: 25,
  isAbd: false,
  hasFeeOffset: false,
  isInternational: false,
  creditsTaught: 0,
  ...extra,
});

describe("gradCostOf", () => {
  it("matches the sheet for a 25% regular appointment with no offsets", () => {
    expect(gradCostOf(fallTerm, student())?.total).toBeCloseTo(12482.37, 2);
  });

  it("matches the sheet for a 50% ABD appointment", () => {
    const cost = gradCostOf(
      fallTerm,
      student({ appointmentPercent: 50, isAbd: true }),
    );

    expect(cost?.total).toBeCloseTo(16693.54, 2);
    expect(cost?.tuition).toBeCloseTo(3.98 * 392, 2);
  });

  it("adds the fee offset at the 25% appointment's half share", () => {
    const cost = gradCostOf(fallTerm, student({ hasFeeOffset: true }));

    expect(cost?.base).toBeCloseTo(5870.2, 2);
    expect(cost?.feeOffset).toBeCloseTo(117.5, 2);
    expect(cost?.pay).toBeCloseTo(5987.7, 2);
  });

  it("pays a quarter of an offset at 12.5%, half at 37.5%, all at 50%", () => {
    const offsetAt = (appointmentPercent: number) =>
      gradCostOf(fallTerm, student({ appointmentPercent, hasFeeOffset: true }))
        ?.feeOffset;

    expect(offsetAt(12.5)).toBeCloseTo(58.75, 2);
    expect(offsetAt(37.5)).toBeCloseTo(117.5, 2);
    expect(offsetAt(50)).toBeCloseTo(235, 2);
  });

  it("adds the international offset with the same share", () => {
    const cost = gradCostOf(
      fallTerm,
      student({ appointmentPercent: 12.5, isInternational: true }),
    );

    expect(cost?.internationalOffset).toBeCloseTo(70, 2);
  });

  it("refuses a fee offset to an ABD student", () => {
    const cost = gradCostOf(
      fallTerm,
      student({ isAbd: true, hasFeeOffset: true }),
    );

    expect(cost?.feeOffset).toBe(0);
    expect(cost?.pay).toBeCloseTo(5870.2, 2);
  });

  it("pays a grad instructor per credit, with health on the whole pay", () => {
    const cost = gradCostOf(
      fallTerm,
      student({ isAbd: true, creditsTaught: 3 }),
    );

    expect(cost?.instructorPay).toBe(750);
    expect(cost?.pay).toBeCloseTo(6620.2, 2);
    expect(cost?.health).toBeCloseTo(0.289 * 6620.2, 2);
  });

  it("is null without a term, and without any appointment levels", () => {
    expect(gradCostOf(null, student())).toBeNull();
    expect(
      gradCostOf(
        { inputs: FALL_GRAD_INPUTS, hoursByAppointmentPercent: new Map() },
        student(),
      ),
    ).toBeNull();
  });

  it("costs an appointment between levels from the nearest level's hours", () => {
    expect(
      gradCostOf(fallTerm, student({ appointmentPercent: 30 }))?.hours,
    ).toBeCloseTo((196 * 30) / 25, 6);
  });
});

describe("offsetShareOf", () => {
  it("steps up at 25% and at 50%", () => {
    expect([12.5, 24.9, 25, 37.5, 50, 75].map(offsetShareOf)).toEqual([
      0.25, 0.25, 0.5, 0.5, 1, 1,
    ]);
  });
});

describe("gradTermOf", () => {
  const assumptions = costAssumptions({ gradRates: gradRates() });

  it("is the admin's values when nothing is overridden", () => {
    const term = gradTermOf(assumptions, rateOverrides());

    expect(term?.inputs).toEqual(FALL_GRAD_INPUTS);
    expect(term?.hoursByAppointmentPercent.get(25)).toBe(196);
  });

  it("puts the department's values over the admin's, field by field", () => {
    const term = gradTermOf(
      assumptions,
      rateOverrides({
        gradInputs: { hourlyRate: 31 },
        gradHoursByPercent: new Map([[25, 200]]),
      }),
    );

    expect(term?.inputs.hourlyRate).toBe(31);
    expect(term?.inputs.healthRate).toBe(0.289);
    expect(term?.hoursByAppointmentPercent.get(25)).toBe(200);
    expect(term?.hoursByAppointmentPercent.get(50)).toBe(392);
  });

  it("is null when an input is missing", () => {
    const missing = costAssumptions({
      gradRates: gradRates({ defaults: null }),
    });

    expect(gradTermOf(missing, rateOverrides())).toBeNull();
  });

  it("is complete when the department fills every input the admin left out", () => {
    const missing = costAssumptions({
      gradRates: gradRates({ defaults: null }),
    });

    expect(
      gradTermOf(missing, rateOverrides({ gradInputs: FALL_GRAD_INPUTS }))
        ?.inputs,
    ).toEqual(FALL_GRAD_INPUTS);
  });
});

describe("appointmentPercentOfSection", () => {
  it("is 12.5% for a TA on any component", () => {
    expect(
      ["LAB", "DIS", "LEC", "SEM"].map((component) =>
        appointmentPercentOfSection(component, true, 25),
      ),
    ).toEqual([12.5, 12.5, 12.5, 12.5]);
  });

  it("is 12.5% for an instructor of a lab or discussion and the per-section appointment otherwise", () => {
    expect(
      ["LAB", "DIS", "LEC", "SEM"].map((component) =>
        appointmentPercentOfSection(component, false, 25),
      ),
    ).toEqual([12.5, 12.5, 25, 25]);
  });
});

describe("hoursOfAppointment", () => {
  const levels = new Map([
    [12.5, 450],
    [25, 900],
    [50, 1800],
  ]);

  it("is a level's own hours at that exact percent", () => {
    expect(hoursOfAppointment(levels, 25)).toBe(900);
  });

  it("is in proportion to the nearest level between levels", () => {
    expect(hoursOfAppointment(levels, 40)).toBe(1440);
    expect(hoursOfAppointment(levels, 20)).toBe(720);
  });

  it("is in proportion to the nearest level beyond the highest", () => {
    expect(hoursOfAppointment(levels, 75)).toBe(2700);
  });

  it("is undefined without levels", () => {
    expect(hoursOfAppointment(new Map(), 25)).toBeUndefined();
  });
});
