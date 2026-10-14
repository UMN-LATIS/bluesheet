import { describe, expect, it } from "vitest";
import { unpaidReasonOf } from "./costReason";

const labelOfSection = (sectionId: number) => `Label ${sectionId}`;

describe("unpaidReasonOf", () => {
  it("gives no reason for a line paid on its own section", () => {
    expect(unpaidReasonOf({ kind: "rate" }, labelOfSection)).toBeNull();
  });

  it("names the section that pays and the rule that sent it there", () => {
    expect(
      unpaidReasonOf(
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

  it("says a grad student's appointment is paid once per term", () => {
    expect(
      unpaidReasonOf(
        {
          kind: "chargedOnOtherSection",
          sectionId: 3,
          reason: "gradAppointment",
        },
        labelOfSection,
      ),
    ).toBe(
      "Paid on Label 3. A grad student's appointment is paid once per term.",
    );
  });

  it("names the lecture that pays a lab", () => {
    expect(
      unpaidReasonOf(
        { kind: "paidOnLecture", lectureSectionId: 1 },
        labelOfSection,
      ),
    ).toMatch(/^Paid on the lecture, Label 1\./);
  });
});
