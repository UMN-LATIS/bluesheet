import { describe, expect, it } from "vitest";
import {
  lineOverrideAmountsByKeyOf,
  rateOverrideKeyOf,
  rateOverridesOf,
  taRateKeyOf,
  type RateIdentity,
} from "./costOverrides";

const lecturer: RateIdentity = { kind: "jobCode", jobCode: "9753" };
const abdTa: RateIdentity = {
  kind: "taAppointment",
  appointmentPercent: 25,
  studentStatus: "abd",
};
const person: RateIdentity = { kind: "person", emplid: 42 };

describe("rateOverridesOf", () => {
  const saved = {
    jobCodes: [{ jobCode: "9753", costPerCourse: 11000 }],
    taAppointments: [
      {
        appointmentPercent: 25,
        studentStatus: "abd" as const,
        costPerTerm: 9000,
      },
    ],
    people: [{ emplid: 42, amount: 7000 }],
  };

  it("keeps the saved overrides when nothing is pending", () => {
    const overrides = rateOverridesOf(saved, {});

    expect(overrides.costPerCourseByJobCode.get("9753")).toBe(11000);
    expect(overrides.costPerTermByTaRateKey.get(taRateKeyOf(25, "abd"))).toBe(
      9000,
    );
    expect(overrides.costPerSectionByEmplid.get(42)).toBe(7000);
  });

  it("puts a pending amount over the saved one", () => {
    const overrides = rateOverridesOf(saved, {
      [rateOverrideKeyOf(lecturer)]: { rate: lecturer, amount: 12000 },
    });

    expect(overrides.costPerCourseByJobCode.get("9753")).toBe(12000);
  });

  it("drops the saved override when the pending amount is null", () => {
    const overrides = rateOverridesOf(saved, {
      [rateOverrideKeyOf(abdTa)]: { rate: abdTa, amount: null },
    });

    expect(overrides.costPerTermByTaRateKey.size).toBe(0);
  });

  it("puts a pending person's rate over the saved one", () => {
    const overrides = rateOverridesOf(saved, {
      [rateOverrideKeyOf(person)]: { rate: person, amount: 7500 },
    });

    expect(overrides.costPerSectionByEmplid.get(42)).toBe(7500);
  });

  it("keys a job code, a TA rate, and a person apart", () => {
    const keys = [lecturer, abdTa, person].map(rateOverrideKeyOf);

    expect(new Set(keys).size).toBe(3);
  });
});

describe("lineOverrideAmountsByKeyOf", () => {
  const anth1001 = (section: string) => ({ courseCode: "ANTH-1001", section });

  it("puts pending edits over saved ones, and a null amount removes one", () => {
    const overrides = lineOverrideAmountsByKeyOf(
      [
        { ...anth1001("001"), emplid: 7, amount: 100 },
        { ...anth1001("002"), emplid: 7, amount: 200 },
      ],
      {
        a: { ...anth1001("001"), emplid: 7, amount: 150 },
        b: { ...anth1001("002"), emplid: 7, amount: null },
      },
    );

    expect([...overrides.entries()]).toEqual([["ANTH-1001|001|7", 150]]);
  });
});
