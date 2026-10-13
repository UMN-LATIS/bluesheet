import type {
  CostAssumptions,
  CostPerson,
  JobCodeRate,
  TaAppointmentRate,
} from "@/types";
import type { SisInstructor } from "../types";
import type { RateOverrides } from "./costOverrides";

export const jobCodeRate = (
  code: string,
  costPerCourse: number | null,
  extra: Partial<JobCodeRate> = {},
): JobCodeRate => ({
  code,
  title: `Title ${code}`,
  instructorType: "contract_visiting",
  annualLoad: null,
  studentStatus: null,
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

export const rateOverrides = (
  extra: Partial<RateOverrides> = {},
): RateOverrides => ({
  costPerCourseByJobCode: new Map(),
  costPerTermByTaRateKey: new Map(),
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
  people: [],
  rateOverrides: { jobCodes: [], taAppointments: [] },
  lineOverrides: [],
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
