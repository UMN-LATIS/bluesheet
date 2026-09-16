import { describe, expect, it } from "vitest";
import { isEligibleWhenTenured, leaveBarLabelOf } from "./leaveLabels";
import { leave, person } from "./planning.fixture";

describe("isEligibleWhenTenured", () => {
  const eligibleSabbatical = leave(1, "2027-01-19", "2027-05-12", {
    status: "eligible",
  });

  it("marks an eligible sabbatical held by an assistant professor", () => {
    const assistantProfessor = person(1, { jobCodes: ["9403"] });

    expect(isEligibleWhenTenured(eligibleSabbatical, assistantProfessor)).toBe(
      true,
    );
    expect(leaveBarLabelOf(eligibleSabbatical, assistantProfessor)).toBe(
      "Sabbatical · when tenured",
    );
  });

  it("leaves a tenured professor's eligible sabbatical alone", () => {
    expect(isEligibleWhenTenured(eligibleSabbatical, person(1))).toBe(false);
  });
});
