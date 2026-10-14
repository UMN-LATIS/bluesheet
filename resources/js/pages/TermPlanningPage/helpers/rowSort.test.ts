import { describe, expect, it } from "vitest";
import { nextSortOf, sortedRows } from "./rowSort";

describe("sortedRows", () => {
  const rows = [
    { name: "ANTH 3001", cost: 500 },
    { name: "ANTH 1001", cost: null },
    { name: "ANTH 10001", cost: 900 },
  ];

  it("compares text with numbers in numeric order", () => {
    const names = sortedRows(rows, ({ name }) => name, "ascending").map(
      ({ name }) => name,
    );

    expect(names).toEqual(["ANTH 1001", "ANTH 3001", "ANTH 10001"]);
  });

  it("puts nulls last in either direction", () => {
    const costsOf = (direction: "ascending" | "descending") =>
      sortedRows(rows, ({ cost }) => cost, direction).map(({ cost }) => cost);

    expect(costsOf("ascending")).toEqual([500, 900, null]);
    expect(costsOf("descending")).toEqual([900, 500, null]);
  });

  it("keeps the rows' own order for ties", () => {
    const tied = [
      { id: 1, flag: true },
      { id: 2, flag: false },
      { id: 3, flag: true },
    ];

    expect(
      sortedRows(tied, ({ flag }) => flag, "descending").map(({ id }) => id),
    ).toEqual([1, 3, 2]);
  });
});

describe("nextSortOf", () => {
  it("cycles a column through ascending, descending, and unsorted", () => {
    const ascending = nextSortOf(null, 2);
    const descending = nextSortOf(ascending, 2);

    expect(ascending).toEqual({ columnIndex: 2, direction: "ascending" });
    expect(descending).toEqual({ columnIndex: 2, direction: "descending" });
    expect(nextSortOf(descending, 2)).toBeNull();
  });

  it("starts another column at ascending", () => {
    expect(nextSortOf({ columnIndex: 2, direction: "descending" }, 4)).toEqual({
      columnIndex: 4,
      direction: "ascending",
    });
  });
});
