import type { PersonRow } from "./peopleRows";
import { hasEmplid, type PersonWithEmplid } from "./personWithEmplid";

export type TenureTrackRow = PersonWithEmplid;

export interface TenureTrackTotals {
  count: number;
  releases: number;
  load: number;
  cost: number;
}

const isTenureTrack = ({ instructorType }: PersonRow) =>
  instructorType === "recurring_budget_faculty";

const sumOf = (amounts: (number | null)[]) =>
  amounts.reduce<number>((total, amount) => total + (amount ?? 0), 0);

export function tenureTrackRowsOf(people: PersonRow[]): {
  rows: TenureTrackRow[];
  totals: TenureTrackTotals;
} {
  const rows = people.filter(isTenureTrack).filter(hasEmplid);

  return {
    rows,
    totals: {
      count: rows.length,
      releases: sumOf(rows.map(({ courseReleases }) => courseReleases)),
      load: sumOf(rows.map(({ paidSectionCount }) => paidSectionCount)),
      cost: sumOf(rows.map(({ total }) => total)),
    },
  };
}
