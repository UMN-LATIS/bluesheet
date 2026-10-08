import type {
  CostAssumptions,
  CostPerson,
  CostSetting,
  CostSettingValue,
  JobCodeRate,
  PersonChoice,
  TaAppointmentRate,
} from "@/types";
import type { SisInstructor } from "../types";
import type { CostRuleSettings } from "./costRules";

export const jobCodeRate = (
  code: string,
  costPerCourse: number | null,
  extra: Partial<JobCodeRate> = {},
): JobCodeRate => ({
  code,
  title: `Title ${code}`,
  instructorType: "contract_visiting",
  costPerCourse,
  rateFiscalYear: costPerCourse === null ? null : 2027,
  source: null,
  ...extra,
});

export const taAppointmentRate = (
  costPerTerm: number,
  extra: Partial<TaAppointmentRate> = {},
): TaAppointmentRate => ({
  season: "fall",
  studentStatus: "regular",
  appointmentPercent: 25,
  costPerTerm,
  source: null,
  ...extra,
});

export const costSetting = (
  key: string,
  value: CostSettingValue,
): CostSetting => ({
  key,
  label: key,
  description: "",
  type: typeof value === "boolean" ? "toggle" : "money",
  default: value,
  value,
  valueFiscalYear: null,
});

export const personChoice = (
  emplid: number,
  extra: Partial<PersonChoice> = {},
): PersonChoice => ({
  emplid,
  jobCode: null,
  instructorType: null,
  studentStatus: null,
  overrideCost: null,
  overrideReason: null,
  ...extra,
});

export const costRuleSettings = (
  extra: Partial<CostRuleSettings> = {},
): CostRuleSettings => ({
  unstaffedSectionCost: 5000,
  unratedJobCodeCost: 7000,
  taAppointmentPercent: 25,
  isRecurringBudgetFree: false,
  isIndependentStudyFree: false,
  isFieldworkFree: false,
  ...extra,
});

export const costPerson = (
  emplid: number,
  jobCodes: string[],
  positionTitles: CostPerson["positionTitles"] = {},
): CostPerson => ({ emplid, jobCodes, positionTitles });

export const costAssumptions = (
  extra: Partial<CostAssumptions> = {},
): CostAssumptions => ({
  termCode: 1269,
  fiscalYear: 2027,
  season: "fall",
  jobCodes: [],
  taRates: { fiscalYear: 2027, rates: [] },
  settings: [],
  people: [],
  personChoices: [],
  canEdit: true,
  ...extra,
});

export const sisInstructor = (
  emplid: number,
  role: "PI" | "TA",
): SisInstructor => ({
  emplid,
  role,
  name: `Person ${emplid}`,
  lastName: `Last${emplid}`,
  internetId: `p${emplid}`,
});
