/** Who teaches a section: the same split the sheet reads open or locked. */

import type { SisInstructor } from "../types";

/** The SIS instructor-of-record role. */
export const PRIMARY_ROLE = "PI";

/** The role recorded when someone is added from the teaching assistants list. */
export const TA_ROLE = "TA";

/**
 * The instructor(s) of record: everyone marked PI, or else the first
 * instructor who is not an assistant. Empty on a section the SIS sent with
 * assistants alone, which is the usual shape of a discussion or a lab.
 */
export function instructorsOfRecord(
  instructors: SisInstructor[],
): SisInstructor[] {
  const primaries = instructors.filter(({ role }) => role === PRIMARY_ROLE);
  if (primaries.length > 0) return primaries;

  return instructors.filter(({ role }) => role !== TA_ROLE).slice(0, 1);
}

/**
 * Everyone the section carries who is not already listed as teaching it.
 * Measured against whoever the list above actually shows rather than against
 * the role, because a section the SIS sent with no instructor of record falls
 * back to its first instructor, and that person must not then appear twice.
 */
export function assistantsOf(instructors: SisInstructor[]): SisInstructor[] {
  const ofRecord = instructorsOfRecord(instructors);

  return instructors.filter(
    (instructor) =>
      !ofRecord.some((primary) => primary.emplid === instructor.emplid),
  );
}

/** "ML" for Monica Luciana; "?" for a name the SIS never sent. */
export function initialsOf(instructor: SisInstructor): string {
  const name = instructor.name?.trim();
  if (!name) return "?";

  const last = instructor.lastName?.trim().charAt(0) ?? "";
  return (name.charAt(0) + last).toUpperCase();
}

/** Last name where the SIS sent one, full name otherwise, "TBA" for nobody. */
const shortNameOf = (instructor: SisInstructor | undefined): string =>
  instructor?.lastName ?? instructor?.name ?? "TBA";

/**
 * The one name a block or card has room for: the first instructor of record,
 * or "TBA" where the section has none.
 */
export const leadInstructorName = (instructors: SisInstructor[]): string =>
  shortNameOf(instructorsOfRecord(instructors)[0]);

/** The assistants a block or card names, or null where it has none to name. */
export function assistantNames(instructors: SisInstructor[]): string | null {
  const assistants = assistantsOf(instructors);
  if (assistants.length === 0) return null;

  return assistants.map(shortNameOf).join(", ");
}

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
