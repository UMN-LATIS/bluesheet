export type CostBasis =
  | { kind: "rate" }
  | {
      kind: "plannerSet";
      automaticBasis: CostBasis;
      /** Null when the automatic line has no rate. */
      automaticSalary: number | null;
    }
  | { kind: "freeComponent" }
  | { kind: "paidOnLecture"; lectureSectionId: number }
  | {
      kind: "chargedOnOtherSection";
      sectionId: number;
      reason: ChargedElsewhereReason;
    };

export type ChargedElsewhereReason = "crosslisted" | "sameMeetingTime";
