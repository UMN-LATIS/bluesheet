import type { ChargedElsewhereReason, CostBasis } from "./costBasis";

const CHARGED_ELSEWHERE_RULES: Record<ChargedElsewhereReason, string> = {
  crosslisted: "Crosslisted sections are paid once.",
  sameMeetingTime:
    "It meets at the same time, and a person is paid once per meeting time.",
  taOncePerCourse: "A TA is paid once per course.",
};

type ChargedElsewhere = Extract<CostBasis, { kind: "chargedOnOtherSection" }>;

export const chargedElsewhereReasonOf = (
  { sectionId, reason }: ChargedElsewhere,
  labelOfSection: (sectionId: number) => string,
) => `Paid on ${labelOfSection(sectionId)}. ${CHARGED_ELSEWHERE_RULES[reason]}`;

export function unpaidReasonOf(
  basis: CostBasis,
  labelOfSection: (sectionId: number) => string,
): string | null {
  switch (basis.kind) {
    case "rate":
    case "lineOverride":
      return null;
    case "freeComponent":
      return "Not paid. Independent study and field work have no per-section cost.";
    case "paidOnLecture":
      return `Paid on the lecture, ${labelOfSection(basis.lectureSectionId)}. A course with a lecture pays its instructor there, not on each lab or discussion.`;
    case "chargedOnOtherSection":
      return chargedElsewhereReasonOf(basis, labelOfSection);
  }
}
