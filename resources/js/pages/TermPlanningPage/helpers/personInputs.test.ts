import { describe, expect, it } from "vitest";
import { personInputKeyOf, personInputsOf } from "./personInputs";

const saved = [
  {
    emplid: 1,
    notes: "On sabbatical in spring",
    yearStarted: 2019,
    courseReleases: 1,
    releaseSource: "Grant",
    expectedSections: 2,
  },
];

describe("personInputsOf", () => {
  it("keeps the saved inputs when nothing is pending", () => {
    expect(personInputsOf(saved, {}).get(1)).toEqual({
      notes: "On sabbatical in spring",
      yearStarted: 2019,
      courseReleases: 1,
      releaseSource: "Grant",
      expectedSections: 2,
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
      [personInputKeyOf(9, "expectedSections")]: {
        emplid: 9,
        field: "expectedSections",
        value: 3,
      },
    });

    expect(inputs.get(9)).toEqual({
      notes: null,
      yearStarted: null,
      courseReleases: null,
      releaseSource: null,
      expectedSections: 3,
    });
  });
});
