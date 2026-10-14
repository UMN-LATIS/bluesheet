import type {
  CostAssumptions,
  CostPerson,
  GradAppointmentLevel,
  GradRateInputs,
  JobCodeRate,
  StudentStatus,
} from "@/types";
import type { SisInstructor } from "../types";
import type { RateOverrides } from "./costOverrides";

export const jobCodeRate = (
  code: string,
  salary: number | null,
  extra: Partial<JobCodeRate> = {},
): JobCodeRate => ({
  code,
  title: `Title ${code}`,
  instructorType: "contract_visiting",
  annualLoad: null,
  salary,
  fringeRate: salary === null ? null : 0,
  source: null,
  studentStatus: null,
  ...extra,
});

export const rateOverrides = (
  extra: Partial<RateOverrides> = {},
): RateOverrides => ({
  jobCodeRates: new Map(),
  salaryByEmplid: new Map(),
  gradInputs: {},
  gradHoursByPercent: new Map(),
  gradPeopleByEmplid: new Map(),
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
  season: "fall",
  jobCodes: [],
  people: [],
  gradRates: { defaults: null, levels: [] },
  rateOverrides: { jobCodes: [], people: [], grad: null, gradHours: [] },
  gradPeople: [],
  personNotes: [],
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

export const FALL_GRAD_INPUTS: GradRateInputs = {
  hourlyRate: 29.95,
  healthRate: 0.289,
  tuitionPerHourRegular: 25.08,
  tuitionPerHourAbd: 3.98,
  feeOffset: 235,
  internationalOffset: 280,
  perCreditPayment: 250,
};

export const FALL_GRAD_LEVELS: GradAppointmentLevel[] = [
  { appointmentPercent: 12.5, hours: 98 },
  { appointmentPercent: 25, hours: 196 },
  { appointmentPercent: 37.5, hours: 294 },
  { appointmentPercent: 50, hours: 392 },
  { appointmentPercent: 75, hours: 588 },
];

export const gradJobCodeRate = (
  code: string,
  instructorType: "teaching_assistant" | "graduate_instructor",
  studentStatus: StudentStatus,
  extra: Partial<JobCodeRate> = {},
): JobCodeRate =>
  jobCodeRate(code, null, { instructorType, studentStatus, ...extra });

export const gradRates = (
  extra: Partial<CostAssumptions["gradRates"]> = {},
): CostAssumptions["gradRates"] => ({
  defaults: FALL_GRAD_INPUTS,
  levels: FALL_GRAD_LEVELS,
  ...extra,
});

/** A 25% appointment costs $9,000, a 50% one $18,000, and each credit taught adds $100. */
export const roundGradRates = (): CostAssumptions["gradRates"] => ({
  defaults: {
    hourlyRate: 10,
    healthRate: 0,
    tuitionPerHourRegular: 0,
    tuitionPerHourAbd: 0,
    feeOffset: 0,
    internationalOffset: 0,
    perCreditPayment: 100,
  },
  levels: [
    { appointmentPercent: 25, hours: 900 },
    { appointmentPercent: 50, hours: 1800 },
  ],
});
