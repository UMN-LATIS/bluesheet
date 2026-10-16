export const sumOf = (amounts: (number | null)[]): number =>
  amounts.reduce<number>((total, amount) => total + (amount ?? 0), 0);
