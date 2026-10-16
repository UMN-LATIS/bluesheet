import { describe, expect, it } from "vitest";
import { gradPersonKeyOf, costInputsOf, type CostEdits } from "./costOverrides";
import { costAssumptions, personInputs } from "./costAssumptions.fixture";
import { personInputKeyOf, type PersonInputEdit } from "./personInputs";

const noEdits: CostEdits = { personInputEdits: {}, gradPersonEdits: {} };

const inputEdit = (edit: PersonInputEdit): CostEdits => ({
  ...noEdits,
  personInputEdits: { [personInputKeyOf(edit.emplid, edit.field)]: edit },
});

describe("costInputsOf", () => {
  const saved = costAssumptions({
    personInputs: [personInputs(42, { salary: 7000, fringeRate: 0.2 })],
    gradPeople: [{ emplid: 7, hasFeeOffset: true, isInternational: false }],
  });

  it("keeps the saved overrides when nothing is pending", () => {
    const overrides = costInputsOf(saved, noEdits);

    expect(overrides.personInputsByEmplid.get(42)?.salary).toBe(7000);
    expect(overrides.gradPeopleByEmplid.get(7)?.hasFeeOffset).toBe(true);
  });

  it("shows a pending salary edit over the saved one, and a null edit as no override", () => {
    const edited = costInputsOf(
      saved,
      inputEdit({ emplid: 42, field: "salary", value: 8000 }),
    );
    const reset = costInputsOf(
      saved,
      inputEdit({ emplid: 42, field: "salary", value: null }),
    );

    expect(edited.personInputsByEmplid.get(42)?.salary).toBe(8000);
    expect(edited.personInputsByEmplid.get(42)?.fringeRate).toBe(0.2);
    expect(reset.personInputsByEmplid.get(42)?.salary).toBeNull();
  });

  it("replaces a person's grad settings, and drops a person back to the defaults", () => {
    const changed = costInputsOf(saved, {
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

    const dropped = costInputsOf(saved, {
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
