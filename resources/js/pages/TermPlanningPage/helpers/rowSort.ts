export type SortValue = string | number | boolean | null;

export type SortDirection = "ascending" | "descending";

export interface RowSort {
  columnIndex: number;
  direction: SortDirection;
}

export function nextSortOf(
  sort: RowSort | null,
  columnIndex: number,
): RowSort | null {
  if (sort?.columnIndex !== columnIndex) {
    return { columnIndex, direction: "ascending" };
  }

  return sort.direction === "ascending"
    ? { columnIndex, direction: "descending" }
    : null;
}

export function sortedRows<Row>(
  rows: Row[],
  sortValueOf: (row: Row) => SortValue,
  direction: SortDirection,
): Row[] {
  const sign = direction === "ascending" ? 1 : -1;

  return rows
    .map((row) => ({ row, value: sortValueOf(row) }))
    .toSorted((a, b) => {
      if (a.value === null || b.value === null) {
        return Number(a.value === null) - Number(b.value === null);
      }

      return sign * compareValues(a.value, b.value);
    })
    .map(({ row }) => row);
}

function compareValues(
  a: string | number | boolean,
  b: string | number | boolean,
): number {
  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b, undefined, { numeric: true });
  }

  return Number(a) - Number(b);
}
