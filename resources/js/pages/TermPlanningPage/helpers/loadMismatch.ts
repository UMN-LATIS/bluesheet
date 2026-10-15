export const isLoadMismatched = (expected: number | null, covered: number) =>
  expected !== null && expected !== covered;
