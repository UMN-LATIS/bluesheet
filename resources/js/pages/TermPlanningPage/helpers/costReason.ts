import type { ChargedElsewhereReason, CostBasis } from "./costBasis";

const CHARGED_ELSEWHERE_RULES: Record<ChargedElsewhereReason, string> = {
  crosslisted: "Crosslisted sections are paid once.",
  sameMeetingTime:
    "It meets at the same time, and a person is paid once per meeting time.",
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
      return null;
    case "freeComponent":
      return "Not paid. Independent study and field work have no per-section cost.";
    case "paidOnLecture":
      return `Paid on the lecture, ${labelOfSection(basis.lectureSectionId)}. Someone on a course's lecture is paid there, not again on its labs or discussions.`;
    case "chargedOnOtherSection":
      return chargedElsewhereReasonOf(basis, labelOfSection);
  }
}
