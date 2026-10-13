import { describe, expect, it } from "vitest";
import {
  lineOverridesByKeyOf,
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
  };

  it("keeps the saved overrides when nothing is pending", () => {
    const overrides = rateOverridesOf(saved, {});

    expect(overrides.costPerCourseByJobCode.get("9753")).toBe(11000);
    expect(overrides.costPerTermByTaRateKey.get(taRateKeyOf(25, "abd"))).toBe(
      9000,
    );
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

  it("keys a job code and a TA rate apart", () => {
    expect(rateOverrideKeyOf(lecturer)).not.toBe(rateOverrideKeyOf(abdTa));
  });
});

describe("lineOverridesByKeyOf", () => {
  const anth1001 = (section: string) => ({ courseCode: "ANTH-1001", section });

  it("puts pending edits over saved ones, and a null amount removes one", () => {
    const overrides = lineOverridesByKeyOf(
      [
        { ...anth1001("001"), emplid: 7, amount: 100, reason: null },
        { ...anth1001("002"), emplid: 7, amount: 200, reason: null },
      ],
      {
        a: { ...anth1001("001"), emplid: 7, amount: 150, reason: "Grant" },
        b: { ...anth1001("002"), emplid: 7, amount: null, reason: null },
      },
    );

    expect([...overrides.entries()]).toEqual([
      ["ANTH-1001|001|7", { amount: 150, reason: "Grant" }],
    ]);
  });
});
