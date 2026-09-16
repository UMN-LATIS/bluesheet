export interface LanedItem<T> {
  item: T;
  /** 0 is the top lane */
  lane: number;
}

/**
 * Dates are inclusive "YYYY-MM-DD": an item ending on the
 * day another starts takes a lane of its own.
 */
export function laneByDate<T extends { startDate: string; endDate: string }>(
  items: T[],
): { laned: LanedItem<T>[]; laneCount: number } {
  const laneEnds: string[] = [];
  const byStart = [...items].sort(
    (a, b) =>
      a.startDate.localeCompare(b.startDate) ||
      a.endDate.localeCompare(b.endDate),
  );

  const laned = byStart.map((item) => {
    const freeLane = laneEnds.findIndex((end) => end < item.startDate);
    const lane = freeLane === -1 ? laneEnds.length : freeLane;
    laneEnds[lane] = item.endDate;
    return { item, lane };
  });

  return { laned, laneCount: laneEnds.length };
}
