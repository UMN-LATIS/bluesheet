import type { CostAssumptions, CostPerson, JobCodeRate } from "@/types";
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
  ...extra,
});

export const rateOverrides = (
  extra: Partial<RateOverrides> = {},
): RateOverrides => ({
  jobCodeRates: new Map(),
  salaryByEmplid: new Map(),
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
  rateOverrides: { jobCodes: [], people: [] },
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
