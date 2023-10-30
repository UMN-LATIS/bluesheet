export function sortEntriesByKey(
  a: [key: string, value: unknown],
  b: [key: string, value: unknown],
): number {
  return a[0].localeCompare(b[0]);
}
