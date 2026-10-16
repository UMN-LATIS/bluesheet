import type { InstructorType } from "@/types";

const FUND_LABELS: Record<InstructorType, string> = {
  recurring_budget_faculty: "Recurring",
  recurring_budget_pa: "Recurring",
  contract_visiting: "UI",
  pa_instructor: "UI",
  graduate_instructor: "TA/GI",
  teaching_assistant: "TA/GI",
};

export const fundLabelOf = (instructorType: InstructorType | null) =>
  instructorType ? FUND_LABELS[instructorType] : "—";
