import { describe, expect, it } from "vitest";
import { personInputs } from "./costAssumptions.fixture";
import {
  noPersonInputs,
  personInputKeyOf,
  personInputsOf,
} from "./personInputs";

const saved = [
  personInputs(1, {
    notes: "On sabbatical in spring",
    yearStarted: 2019,
    courseReleases: 1,
    releaseSource: "Grant",
    salary: 7000,
  }),
];

describe("personInputsOf", () => {
  it("keeps the saved inputs when nothing is pending", () => {
    expect(personInputsOf(saved, {}).get(1)).toEqual({
      ...noPersonInputs(),
      notes: "On sabbatical in spring",
      yearStarted: 2019,
      courseReleases: 1,
      releaseSource: "Grant",
      salary: 7000,
    });
  });

  it("shows a pending edit over the saved value and keeps the other fields", () => {
    const inputs = personInputsOf(saved, {
      [personInputKeyOf(1, "notes")]: {
        emplid: 1,
        field: "notes",
        value: "Back",
      },
    });

    expect(inputs.get(1)?.notes).toBe("Back");
    expect(inputs.get(1)?.yearStarted).toBe(2019);
  });

  it("treats a blank string or null edit as no value", () => {
    const blank = personInputsOf(saved, {
      [personInputKeyOf(1, "notes")]: {
        emplid: 1,
        field: "notes",
        value: "  ",
      },
    });
    const cleared = personInputsOf(saved, {
      [personInputKeyOf(1, "yearStarted")]: {
        emplid: 1,
        field: "yearStarted",
        value: null,
      },
    });

    expect(blank.get(1)?.notes).toBeNull();
    expect(cleared.get(1)?.yearStarted).toBeNull();
  });

  it("starts an empty record for a person with nothing saved", () => {
    const inputs = personInputsOf([], {
      [personInputKeyOf(9, "courseReleases")]: {
        emplid: 9,
        field: "courseReleases",
        value: 3,
      },
    });

    expect(inputs.get(9)).toEqual({ ...noPersonInputs(), courseReleases: 3 });
  });

  it("shows a pending cost input over the saved one, and null as no override", () => {
    const edited = personInputsOf(saved, {
      [personInputKeyOf(1, "salary")]: {
        emplid: 1,
        field: "salary",
        value: 8000,
      },
      [personInputKeyOf(1, "healthRate")]: {
        emplid: 1,
        field: "healthRate",
        value: 0,
      },
    });
    const reset = personInputsOf(saved, {
      [personInputKeyOf(1, "salary")]: {
        emplid: 1,
        field: "salary",
        value: null,
      },
    });

    expect(edited.get(1)).toMatchObject({ salary: 8000, healthRate: 0 });
    expect(reset.get(1)?.salary).toBeNull();
  });
});
