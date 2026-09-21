/**
 * "García, Ana". The last name is taken off the end of the full name rather
 * than guessed at from it, which is why the SIS sends it separately: nothing
 * here can tell that "de la Cruz" is one surname and "Ana Maria" two given
 * names. A name that does not end in the last name is left alone.
 */
export function lastNameFirst(
  fullName: string,
  lastName: string | null,
): string {
  if (lastName === null || !fullName.endsWith(lastName)) return fullName;

  const givenNames = fullName.slice(0, -lastName.length).trim();
  return givenNames === "" ? lastName : `${lastName}, ${givenNames}`;
}
