import { describe, expect, it } from "vitest";
import {
  rateOverrideKeyOf,
  rateOverridesOf,
  type RateIdentity,
} from "./costOverrides";

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

describe("rateOverridesOf", () => {
  const saved = {
    jobCodes: [{ jobCode: "9753", salary: 11000, fringeRate: null }],
    people: [{ emplid: 42, salary: 7000 }],
  };

  it("keeps the saved overrides when nothing is pending", () => {
    const overrides = rateOverridesOf(saved, {});

    expect(overrides.jobCodeRates.get("9753")).toEqual({
      salary: 11000,
      fringeRate: null,
    });
    expect(overrides.salaryByEmplid.get(42)).toBe(7000);
  });

  it("applies a pending edit to one field and keeps the other", () => {
    const overrides = rateOverridesOf(saved, {
      [rateOverrideKeyOf(lecturerFringe)]: {
        rate: lecturerFringe,
        amount: 0.5,
      },
    });

    expect(overrides.jobCodeRates.get("9753")).toEqual({
      salary: 11000,
      fringeRate: 0.5,
    });
  });

  it("adds an override for a job code with none saved", () => {
    const overrides = rateOverridesOf(
      { jobCodes: [], people: [] },
      {
        [rateOverrideKeyOf(lecturerSalary)]: {
          rate: lecturerSalary,
          amount: 12000,
        },
      },
    );

    expect(overrides.jobCodeRates.get("9753")).toEqual({
      salary: 12000,
      fringeRate: null,
    });
  });

  it("drops the job code when a pending reset clears its last field", () => {
    const overrides = rateOverridesOf(saved, {
      [rateOverrideKeyOf(lecturerSalary)]: {
        rate: lecturerSalary,
        amount: null,
      },
    });

    expect(overrides.jobCodeRates.has("9753")).toBe(false);
  });

  it("applies and resets a person's salary", () => {
    const edited = rateOverridesOf(saved, {
      [rateOverrideKeyOf(person)]: { rate: person, amount: 8000 },
    });
    const reset = rateOverridesOf(saved, {
      [rateOverrideKeyOf(person)]: { rate: person, amount: null },
    });

    expect(edited.salaryByEmplid.get(42)).toBe(8000);
    expect(reset.salaryByEmplid.has(42)).toBe(false);
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
