import { describe, expect, it } from "vitest";
import {
  costAssumptions,
  FALL_GRAD_INPUTS,
  FALL_GRAD_LEVELS,
  gradRates,
} from "./costAssumptions.fixture";
import {
  appointmentPercentOfSection,
  defaultAppointmentOf,
  gradCostOf,
  hoursOfAppointment,
  gradTermOf,
  offsetShareOf,
  type GradOverrides,
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
      gradCostOf(fallTerm, student({ appointmentPercent: 30 }))?.figures.hours,
    ).toBeCloseTo((196 * 30) / 25, 6);
  });
});

describe("gradCostOf overrides", () => {
  const costWith = (
    overrides: GradOverrides,
    extra: Partial<GradStudent> = {},
  ) => {
    const cost = gradCostOf(fallTerm, student(extra), overrides);
    if (cost === null) throw new Error("No grad cost");

    return cost;
  };

  it("falls back to the term's figures for a null override", () => {
    const cost = costWith({ hourlyRate: null, hours: null, healthRate: null });

    expect(cost.total).toBeCloseTo(12482.37, 2);
    expect(cost.figures).toEqual(cost.figuresWithoutOverrides);
  });

  it("pays the overridden hourly rate over the overridden hours", () => {
    const cost = costWith({ hourlyRate: 40, hours: 100 });

    expect(cost.base).toBe(4000);
    expect(cost.figures.hours).toBe(100);
    expect(cost.figuresWithoutOverrides).toMatchObject({
      hourlyRate: 29.95,
      hours: 196,
    });
  });

  it("charges no health for a health rate of 0", () => {
    const cost = costWith({ healthRate: 0 });

    expect(cost.health).toBe(0);
    expect(cost.fringe).toBeCloseTo(cost.tuition, 6);
  });

  it("replaces the tuition rate of whichever standing applies", () => {
    const regular = costWith({ tuitionPerHour: 10 });
    const abd = costWith({ tuitionPerHour: 10 }, { isAbd: true });

    expect(regular.tuition).toBe(1960);
    expect(abd.tuition).toBe(1960);
    expect(regular.figuresWithoutOverrides.tuitionPerHour).toBe(25.08);
    expect(abd.figuresWithoutOverrides.tuitionPerHour).toBe(3.98);
  });

  it("applies the appointment's share to an overridden fee offset", () => {
    const cost = costWith({ feeOffset: 400 }, { hasFeeOffset: true });

    expect(cost.feeOffset).toBe(200);
  });

  it("applies the appointment's share to an overridden international offset", () => {
    const cost = costWith(
      { internationalOffset: 400 },
      { appointmentPercent: 12.5, isInternational: true },
    );

    expect(cost.internationalOffset).toBe(100);
  });

  it("does not pay an overridden offset the student is not eligible for", () => {
    expect(costWith({ feeOffset: 400 }).feeOffset).toBe(0);
  });

  it("pays the overridden credits at the overridden rate per credit", () => {
    const cost = costWith({ creditsTaught: 4, perCreditPayment: 300 });

    expect(cost.instructorPay).toBe(1200);
    expect(cost.figuresWithoutOverrides.creditsTaught).toBe(0);
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

  it("is the admin's values", () => {
    const term = gradTermOf(assumptions);

    expect(term?.inputs).toEqual(FALL_GRAD_INPUTS);
    expect(term?.hoursByAppointmentPercent.get(25)).toBe(196);
  });

  it("is null when the admin has entered no inputs", () => {
    const missing = costAssumptions({
      gradRates: gradRates({ defaults: null }),
    });

    expect(gradTermOf(missing)).toBeNull();
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

describe("defaultAppointmentOf", () => {
  it("is the admin's percent, else the standard 25%", () => {
    expect(
      defaultAppointmentOf(gradRates({ defaultAppointmentPercent: 50 })),
    ).toBe(50);
    expect(defaultAppointmentOf(gradRates())).toBe(25);
  });
});
