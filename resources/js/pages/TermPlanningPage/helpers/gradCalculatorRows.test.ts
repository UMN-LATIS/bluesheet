import { describe, expect, it } from "vitest";
import {
  costAssumptions,
  gradRates,
  roundGradRates,
} from "./costAssumptions.fixture";
import { gradCalculatorOf } from "./gradCalculatorRows";
import type { GradScenario } from "../useScheduleEditor/types";

const scenario = (extra: Partial<GradScenario> = {}): GradScenario => ({
  hasFeeOffset: false,
  isInternational: false,
  creditsTaught: 0,
  ...extra,
});

describe("gradCalculatorOf", () => {
  it("is null when the term has no grad rates", () => {
    expect(gradCalculatorOf(costAssumptions(), scenario())).toBeNull();
  });

  it("lists each appointment level, lowest first, in a Regular and an ABD group", () => {
    const calculator = gradCalculatorOf(
      costAssumptions({
        gradRates: {
          ...roundGradRates(),
          levels: [
            { appointmentPercent: 50, hours: 1800 },
            { appointmentPercent: 12.5, hours: 450 },
          ],
        },
      }),
      scenario(),
    );

    expect(calculator?.groups.map(({ label }) => label)).toEqual([
      "Regular",
      "ABD",
    ]);
    expect(
      calculator?.groups[0]?.rows.map(
        ({ appointmentPercent, hours, total }) => [
          appointmentPercent,
          hours,
          total,
        ],
      ),
    ).toEqual([
      [12.5, 450, 4500],
      [50, 1800, 18000],
    ]);
  });

  it("applies the scenario's credits to every row", () => {
    const calculator = gradCalculatorOf(
      costAssumptions({ gradRates: roundGradRates() }),
      scenario({ creditsTaught: 2 }),
    );

    expect(calculator?.groups[1]?.rows[0]).toMatchObject({
      instructorPay: 200,
      total: 4700,
    });
  });

  it("shows no fee offset for ABD even when the scenario has one", () => {
    const calculator = gradCalculatorOf(
      costAssumptions({ gradRates: gradRates() }),
      scenario({ hasFeeOffset: true }),
    );
    const [regular, abd] = calculator?.groups ?? [];

    expect(regular?.rows[1]?.feeOffset).toBeCloseTo(117.5, 2);
    expect(abd?.rows[1]?.feeOffset).toBeNull();
  });

  it("describes the admin's rates as text", () => {
    const calculator = gradCalculatorOf(
      costAssumptions({ gradRates: gradRates() }),
      scenario(),
    );

    expect(calculator?.inputs).toContainEqual({
      label: "Hourly rate",
      text: "$29.95",
    });
    expect(calculator?.inputs).toContainEqual({
      label: "GA health",
      text: "28.9%",
    });
    expect(calculator?.inputs).toContainEqual({
      label: "Default appointment per section",
      text: "25%",
    });
  });
});
