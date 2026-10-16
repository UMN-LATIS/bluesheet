import type {
  CostAssumptions,
  CostPerson,
  GradAppointmentLevel,
  GradRateInputs,
  JobCodeRate,
  PersonInputRecord,
  StudentStatus,
} from "@/types";
import type { SisInstructor } from "../types";
import type { RateOverrides } from "./costOverrides";
import { noPersonInputs, type PersonInputs } from "./personInputs";

export const jobCodeRate = (
  code: string,
  salary: number | null,
  extra: Partial<JobCodeRate> = {},
): JobCodeRate => ({
  code,
  title: `Title ${code}`,
  instructorType: "contract_visiting",
  salary,
  fringeRate: salary === null ? null : 0,
  source: null,
  studentStatus: null,
  ...extra,
});

export const rateOverrides = (
  extra: Partial<RateOverrides> = {},
): RateOverrides => ({
  personInputsByEmplid: new Map(),
  gradPeopleByEmplid: new Map(),
  ...extra,
});

export const costInputsFor = (
  emplid: number,
  extra: Partial<PersonInputs>,
): Map<number, PersonInputs> =>
  new Map([[emplid, { ...noPersonInputs(), ...extra }]]);

export const personInputs = (
  emplid: number,
  extra: Partial<PersonInputRecord> = {},
): PersonInputRecord => ({ emplid, ...noPersonInputs(), ...extra });

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
  gradRates: { defaults: null, levels: [], defaultAppointmentPercent: null },
  gradPeople: [],
  personInputs: [],
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
  defaultAppointmentPercent: null,
  ...extra,
});

/** A 12.5% appointment costs $4,500, a 25% one $9,000, a 50% one $18,000, and each credit taught adds $100. */
export const ROUND_GRAD_INPUTS: GradRateInputs = {
  hourlyRate: 10,
  healthRate: 0,
  tuitionPerHourRegular: 0,
  tuitionPerHourAbd: 0,
  feeOffset: 0,
  internationalOffset: 0,
  perCreditPayment: 100,
};

export const roundGradRates = (): CostAssumptions["gradRates"] => ({
  defaults: ROUND_GRAD_INPUTS,
  levels: [
    { appointmentPercent: 12.5, hours: 450 },
    { appointmentPercent: 25, hours: 900 },
    { appointmentPercent: 50, hours: 1800 },
  ],
  defaultAppointmentPercent: null,
});
