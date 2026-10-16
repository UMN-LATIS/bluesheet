import { describe, expect, it } from "vitest";
import { notPaidHereReasonOf } from "./costReason";

const labelOfSection = (sectionId: number) => `Label ${sectionId}`;

describe("notPaidHereReasonOf", () => {
  it("gives no reason for a line paid on its own section", () => {
    expect(notPaidHereReasonOf({ kind: "rate" }, labelOfSection)).toBeNull();
  });

  it("names the section that pays and the rule that sent it there", () => {
    expect(
      notPaidHereReasonOf(
        {
          kind: "chargedOnOtherSection",
          sectionId: 3,
          reason: "sameMeetingTime",
        },
        labelOfSection,
      ),
    ).toBe(
      "Paid on Label 3. It meets at the same time, and a person is paid once per meeting time.",
    );
  });

  it("names the lecture that pays a lab", () => {
    expect(
      notPaidHereReasonOf(
        { kind: "paidOnLecture", lectureSectionId: 1 },
        labelOfSection,
      ),
    ).toMatch(/^Paid on the lecture, Label 1\./);
  });
});
