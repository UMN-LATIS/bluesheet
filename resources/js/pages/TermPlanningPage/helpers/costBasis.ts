export type CostBasis =
  | { kind: "rate" }
  | { kind: "freeComponent" }
  | { kind: "paidOnLecture"; lectureSectionId: number }
  | {
      kind: "chargedOnOtherSection";
      sectionId: number;
      reason: ChargedElsewhereReason;
    };

export type ChargedElsewhereReason =
  | "crosslisted"
  | "sameMeetingTime"
  | "taOncePerCourse"
  | "gradAppointment";
