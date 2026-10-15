import type { CostAssumptions } from "@/types";
import { pricingByEmplidOf } from "./termEstimate";

export const jobLabelOf = (jobCode: string, title: string | undefined) =>
  title ? `${jobCode} · ${title}` : jobCode;

export function jobLabelerOf(
  assumptions: CostAssumptions,
): (emplid: number) => string | null {
  const pricingOfEmplid = pricingByEmplidOf(assumptions);
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
      rate?.title ?? positionTitlesByEmplid.get(emplid)?.[jobCode],
    );
  };
}
