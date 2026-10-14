import type { CostAssumptions } from "@/types";

export type RateField = "salary" | "fringeRate";

export type RateIdentity =
  | { kind: "jobCode"; jobCode: string; field: RateField }
  | { kind: "person"; emplid: number };

/** A null amount restores the rate beneath it. */
export interface RateOverrideEdit {
  rate: RateIdentity;
  amount: number | null;
}

export interface JobCodeRateOverrideFields {
  salary: number | null;
  fringeRate: number | null;
}

export interface RateOverrides {
  jobCodeRates: Map<string, JobCodeRateOverrideFields>;
  salaryByEmplid: Map<number, number>;
}

export function rateOverrideKeyOf(rate: RateIdentity): string {
  switch (rate.kind) {
    case "jobCode":
      return `jobCode|${rate.jobCode}|${rate.field}`;
    case "person":
      return `person|${rate.emplid}`;
  }
}

function withJobCodeField(
  jobCodeRates: Map<string, JobCodeRateOverrideFields>,
  jobCode: string,
  field: RateField,
  amount: number | null,
): void {
  const fields = {
    ...(jobCodeRates.get(jobCode) ?? { salary: null, fringeRate: null }),
    [field]: amount,
  };

  if (fields.salary === null && fields.fringeRate === null) {
    jobCodeRates.delete(jobCode);
  } else {
    jobCodeRates.set(jobCode, fields);
  }
}

export function rateOverridesOf(
  saved: CostAssumptions["rateOverrides"],
  edits: Record<string, RateOverrideEdit>,
): RateOverrides {
  const jobCodeRates = new Map(
    saved.jobCodes.map(({ jobCode, salary, fringeRate }) => [
      jobCode,
      { salary, fringeRate },
    ]),
  );
  const salaryByEmplid = new Map(
    saved.people.map(({ emplid, salary }) => [emplid, salary]),
  );

  for (const { rate, amount } of Object.values(edits)) {
    switch (rate.kind) {
      case "jobCode":
        withJobCodeField(jobCodeRates, rate.jobCode, rate.field, amount);
        break;
      case "person":
        if (amount === null) salaryByEmplid.delete(rate.emplid);
        else salaryByEmplid.set(rate.emplid, amount);
        break;
    }
  }

  return { jobCodeRates, salaryByEmplid };
}
