export function sortByName(
  a: { surName: string; givenName: string },
  b: { surName: string; givenName: string },
): number {
  return (
    a.surName.localeCompare(b.surName) || a.givenName.localeCompare(b.givenName)
  );
}
