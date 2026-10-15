import { isLoadMismatched } from "./loadMismatch";
import type { PersonRow } from "./peopleRows";
import { hasEmplid, type PersonWithEmplid } from "./personWithEmplid";

export type TenureTrackRow = PersonWithEmplid & {
  isLoadMismatched: boolean;
};

export interface TenureTrackTotals {
  count: number;
  releases: number;
  expected: number;
  listed: number;
}

const isTenureTrack = ({ instructorType }: PersonRow) =>
  instructorType === "recurring_budget_faculty";

const sumOf = (amounts: (number | null)[]) =>
  amounts.reduce<number>((total, amount) => total + (amount ?? 0), 0);

function tenureTrackRowOf(person: PersonWithEmplid): TenureTrackRow {
  const covered = person.paidSectionCount + (person.courseReleases ?? 0);

  return {
    ...person,
    isLoadMismatched: isLoadMismatched(person.expectedSectionCount, covered),
  };
}

export function tenureTrackRowsOf(people: PersonRow[]): {
  rows: TenureTrackRow[];
  totals: TenureTrackTotals;
} {
  const rows = people
    .filter(isTenureTrack)
    .filter(hasEmplid)
    .map(tenureTrackRowOf);

  return {
    rows,
    totals: {
      count: rows.length,
      releases: sumOf(rows.map(({ courseReleases }) => courseReleases)),
      expected: sumOf(
        rows.map(({ expectedSectionCount }) => expectedSectionCount),
      ),
      listed: sumOf(rows.map(({ paidSectionCount }) => paidSectionCount)),
    },
  };
}
