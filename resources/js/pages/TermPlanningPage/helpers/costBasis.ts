export type CostBasis =
  | { kind: "rate" }
  | {
      kind: "lineOverride";
      /** Null when the replaced line had no rate. */
      replacedAmount: number | null;
    }
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
  | "taOncePerCourse";
