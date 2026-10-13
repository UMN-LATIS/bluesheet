const WHOLE_DOLLARS = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** "$13,578". */
export const formatWholeDollars = (dollars: number) =>
  WHOLE_DOLLARS.format(dollars);

const DOLLARS_AND_CENTS = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/** "$13,578", or "$13,577.79" when there are cents. */
export const formatDollars = (dollars: number) =>
  Number.isInteger(dollars)
    ? formatWholeDollars(dollars)
    : DOLLARS_AND_CENTS.format(dollars);
