export function sortByName(
  a: { surName: string; givenName: string },
  b: { surName: string; givenName: string },
): number {
  if (a.surName === b.surName) {
    return a.givenName.localeCompare(b.givenName);
  }
  return a.surName.localeCompare(b.surName);
}
