interface ItemWithLane<T> {
  item: T;
  /** 0 is the top lane */
  lane: number;
}

/**
 * Dates are inclusive "YYYY-MM-DD": an item ending on the
 * day another starts takes a lane of its own.
 */
export function stackIntoLanes<
  T extends { startDate: string; endDate: string },
>(items: T[]): { itemsWithLane: ItemWithLane<T>[]; laneCount: number } {
  const laneEnds: string[] = [];
  const itemsInStartOrder = [...items].sort(
    (a, b) =>
      a.startDate.localeCompare(b.startDate) ||
      a.endDate.localeCompare(b.endDate),
  );

  const itemsWithLane = itemsInStartOrder.map((item) => {
    const freeLane = laneEnds.findIndex((end) => end < item.startDate);
    const lane = freeLane === -1 ? laneEnds.length : freeLane;
    laneEnds[lane] = item.endDate;
    return { item, lane };
  });

  return { itemsWithLane, laneCount: laneEnds.length };
}
