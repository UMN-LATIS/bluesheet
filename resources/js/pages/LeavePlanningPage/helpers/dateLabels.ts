const monthNameOf = (month: number) =>
  new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });

const partsOf = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { year, month, day };
};

/** "Sep 8" */
export function formatMonthDay(isoDate: string): string {
  const { month, day } = partsOf(isoDate);
  return `${monthNameOf(month)} ${day}`;
}

/**
 * "Jan 19 – May 12, 2027", or both years when they
 * differ.
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = partsOf(startDate);
  const end = partsOf(endDate);
  const startLabel = formatMonthDay(startDate);
  const endLabel = `${formatMonthDay(endDate)}, ${end.year}`;

  if (start.year === end.year) return `${startLabel} – ${endLabel}`;
  return `${startLabel}, ${start.year} – ${endLabel}`;
}
