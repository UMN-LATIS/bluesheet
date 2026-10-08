const WHOLE_DOLLARS = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** "$13,578". */
export const formatWholeDollars = (dollars: number) => WHOLE_DOLLARS.format(dollars);
