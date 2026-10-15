import { describe, expect, it } from "vitest";
import {
  gradPersonKeyOf,
  personSalaryKeyOf,
  rateOverridesOf,
  type CostEdits,
  type PersonSalaryEdit,
} from "./costOverrides";
import { costAssumptions } from "./costAssumptions.fixture";

const noEdits: CostEdits = { personSalaryEdits: {}, gradPersonEdits: {} };

const salaryEdit = (edit: PersonSalaryEdit): CostEdits => ({
  ...noEdits,
  personSalaryEdits: { [personSalaryKeyOf(edit.emplid)]: edit },
});

describe("rateOverridesOf", () => {
  const saved = costAssumptions({
    rateOverrides: { people: [{ emplid: 42, salary: 7000 }] },
    gradPeople: [{ emplid: 7, hasFeeOffset: true, isInternational: false }],
  });

  it("keeps the saved overrides when nothing is pending", () => {
    const overrides = rateOverridesOf(saved, noEdits);

    expect(overrides.salaryByEmplid.get(42)).toBe(7000);
    expect(overrides.gradPeopleByEmplid.get(7)?.hasFeeOffset).toBe(true);
  });

  it("applies and resets a person's salary", () => {
    const edited = rateOverridesOf(
      saved,
      salaryEdit({ emplid: 42, amount: 8000 }),
    );
    const reset = rateOverridesOf(
      saved,
      salaryEdit({ emplid: 42, amount: null }),
    );

    expect(edited.salaryByEmplid.get(42)).toBe(8000);
    expect(reset.salaryByEmplid.has(42)).toBe(false);
  });

  it("replaces a person's grad settings, and drops a person back to the defaults", () => {
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
