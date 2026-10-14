import { describe, expect, it } from "vitest";
import {
  gradHoursKeyOf,
  gradInputKeyOf,
  gradPersonKeyOf,
  rateOverrideKeyOf,
  rateOverridesOf,
  type CostEdits,
  type RateIdentity,
  type RateOverrideEdit,
} from "./costOverrides";
import { costAssumptions } from "./costAssumptions.fixture";

const lecturerSalary: RateIdentity = {
  kind: "jobCode",
  jobCode: "9753",
  field: "salary",
};
const lecturerFringe: RateIdentity = {
  kind: "jobCode",
  jobCode: "9753",
  field: "fringeRate",
};
const person: RateIdentity = { kind: "person", emplid: 42 };

const noEdits: CostEdits = {
  rateOverrideEdits: {},
  gradInputEdits: {},
  gradHoursEdits: {},
  gradPersonEdits: {},
};

const rateEdits = (edits: Record<string, RateOverrideEdit>): CostEdits => ({
  ...noEdits,
  rateOverrideEdits: edits,
});

const assumptionsWith = (
  rateOverrides: Partial<ReturnType<typeof costAssumptions>["rateOverrides"]>,
  extra: Partial<ReturnType<typeof costAssumptions>> = {},
) =>
  costAssumptions({
    rateOverrides: {
      jobCodes: [],
      people: [],
      grad: null,
      gradHours: [],
      ...rateOverrides,
    },
    ...extra,
  });

describe("rateOverridesOf", () => {
  const saved = assumptionsWith({
    jobCodes: [{ jobCode: "9753", salary: 11000, fringeRate: null }],
    people: [{ emplid: 42, salary: 7000 }],
  });

  it("keeps the saved overrides when nothing is pending", () => {
    const overrides = rateOverridesOf(saved, noEdits);

    expect(overrides.jobCodeRates.get("9753")).toEqual({
      salary: 11000,
      fringeRate: null,
    });
    expect(overrides.salaryByEmplid.get(42)).toBe(7000);
  });

  it("applies a pending edit to one field and keeps the other", () => {
    const overrides = rateOverridesOf(
      saved,
      rateEdits({
        [rateOverrideKeyOf(lecturerFringe)]: {
          rate: lecturerFringe,
          amount: 0.5,
        },
      }),
    );

    expect(overrides.jobCodeRates.get("9753")).toEqual({
      salary: 11000,
      fringeRate: 0.5,
    });
  });

  it("adds an override for a job code with none saved", () => {
    const overrides = rateOverridesOf(
      assumptionsWith({}),
      rateEdits({
        [rateOverrideKeyOf(lecturerSalary)]: {
          rate: lecturerSalary,
          amount: 12000,
        },
      }),
    );

    expect(overrides.jobCodeRates.get("9753")).toEqual({
      salary: 12000,
      fringeRate: null,
    });
  });

  it("drops the job code when a pending reset clears its last field", () => {
    const overrides = rateOverridesOf(
      saved,
      rateEdits({
        [rateOverrideKeyOf(lecturerSalary)]: {
          rate: lecturerSalary,
          amount: null,
        },
      }),
    );

    expect(overrides.jobCodeRates.has("9753")).toBe(false);
  });

  it("applies and resets a person's salary", () => {
    const edited = rateOverridesOf(
      saved,
      rateEdits({
        [rateOverrideKeyOf(person)]: { rate: person, amount: 8000 },
      }),
    );
    const reset = rateOverridesOf(
      saved,
      rateEdits({
        [rateOverrideKeyOf(person)]: { rate: person, amount: null },
      }),
    );

    expect(edited.salaryByEmplid.get(42)).toBe(8000);
    expect(reset.salaryByEmplid.has(42)).toBe(false);
  });
});

describe("rateOverridesOf for grad settings", () => {
  const saved = assumptionsWith(
    {
      grad: {
        hourlyRate: 31,
        healthRate: null,
        tuitionPerHourRegular: null,
        tuitionPerHourAbd: null,
        feeOffset: null,
        internationalOffset: null,
        perCreditPayment: null,
        defaultAppointmentPercent: 50,
      },
      gradHours: [{ appointmentPercent: 25, hours: 200 }],
    },
    {
      gradPeople: [
        {
          emplid: 7,
          hasFeeOffset: true,
          isInternational: false,
        },
      ],
    },
  );

  it("keeps only the saved input fields that are set", () => {
    const overrides = rateOverridesOf(saved, noEdits);

    expect(overrides.gradInputs).toEqual({ hourlyRate: 31 });
    expect(overrides.defaultAppointmentPercent).toBe(50);
    expect(overrides.gradHoursByPercent.get(25)).toBe(200);
    expect(overrides.gradPeopleByEmplid.get(7)?.hasFeeOffset).toBe(true);
  });

  it("applies and clears a pending default appointment edit", () => {
    const edited = (value: number | null) =>
      rateOverridesOf(saved, {
        ...noEdits,
        gradInputEdits: {
          [gradInputKeyOf("defaultAppointmentPercent")]: {
            field: "defaultAppointmentPercent",
            value,
          },
        },
      });

    expect(edited(37.5).defaultAppointmentPercent).toBe(37.5);
    expect(edited(null).defaultAppointmentPercent).toBeNull();
    expect(edited(null).gradInputs).toEqual({ hourlyRate: 31 });
  });

  it("applies and clears pending input and hours edits", () => {
    const overrides = rateOverridesOf(saved, {
      ...noEdits,
      gradInputEdits: {
        [gradInputKeyOf("hourlyRate")]: { field: "hourlyRate", value: null },
        [gradInputKeyOf("feeOffset")]: { field: "feeOffset", value: 240 },
      },
      gradHoursEdits: {
        [gradHoursKeyOf(25)]: { appointmentPercent: 25, hours: null },
        [gradHoursKeyOf(50)]: { appointmentPercent: 50, hours: 400 },
      },
    });

    expect(overrides.gradInputs).toEqual({ feeOffset: 240 });
    expect(overrides.gradHoursByPercent.has(25)).toBe(false);
    expect(overrides.gradHoursByPercent.get(50)).toBe(400);
  });

  it("replaces a person's settings, and drops a person back to the defaults", () => {
    const changed = rateOverridesOf(saved, {
      ...noEdits,
      gradPersonEdits: {
        [gradPersonKeyOf(7)]: {
          emplid: 7,
          hasFeeOffset: false,
          isInternational: true,
        },
        [gradPersonKeyOf(8)]: {
          emplid: 8,
          hasFeeOffset: false,
          isInternational: false,
        },
      },
    });

    expect(changed.gradPeopleByEmplid.get(7)?.isInternational).toBe(true);
    expect(changed.gradPeopleByEmplid.has(8)).toBe(false);

    const dropped = rateOverridesOf(saved, {
      ...noEdits,
      gradPersonEdits: {
        [gradPersonKeyOf(7)]: {
          emplid: 7,
          hasFeeOffset: false,
          isInternational: false,
        },
      },
    });
    expect(dropped.gradPeopleByEmplid.has(7)).toBe(false);
  });
});

describe("rateOverrideKeyOf", () => {
  it("keys a job code by code and field, and a person by emplid", () => {
    const keys = [lecturerSalary, lecturerFringe, person].map(
      rateOverrideKeyOf,
    );

    expect(new Set(keys).size).toBe(3);
  });
});
