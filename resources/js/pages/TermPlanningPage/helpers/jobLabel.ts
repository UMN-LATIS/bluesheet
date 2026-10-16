import type { CostAssumptions, JobCodeRate } from "@/types";
import { pricerOf } from "./termEstimate";

export const jobLabelOf = (jobCode: string, title: string | undefined) =>
  title ? `${jobCode} · ${title}` : jobCode;

export function titleOf(
  rate: JobCodeRate | null,
  jobCode: string | null,
  positionTitles: Partial<Record<string, string>> | undefined,
): string {
  if (rate !== null) return rate.title;
  if (jobCode === null) return "";

  return positionTitles?.[jobCode] ?? "";
}

export function jobLabelerOf(
  assumptions: CostAssumptions,
): (emplid: number) => string | null {
  const pricingOfEmplid = pricerOf(assumptions);
  const positionTitlesByEmplid = new Map(
    assumptions.people.map(({ emplid, positionTitles }) => [
      emplid,
      positionTitles,
    ]),
  );

  return (emplid) => {
    const { jobCode, rate } = pricingOfEmplid(emplid);
    if (jobCode === null) return null;

    return jobLabelOf(
      jobCode,
      titleOf(rate, jobCode, positionTitlesByEmplid.get(emplid)),
    );
  };
}
