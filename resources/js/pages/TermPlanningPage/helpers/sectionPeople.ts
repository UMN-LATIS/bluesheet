/** Who teaches a section: the same split the sheet reads open or locked. */

import type { SisInstructor } from "../types";

/** The SIS instructor-of-record role. */
export const PRIMARY_ROLE = "PI";

/** The role recorded when someone is added from the teaching assistants list. */
export const TA_ROLE = "TA";

/** The instructor(s) of record, or the first instructor when none is marked PI. */
export function instructorsOfRecord(
  instructors: SisInstructor[],
): SisInstructor[] {
  const primaries = instructors.filter(({ role }) => role === PRIMARY_ROLE);

  return primaries.length > 0 ? primaries : instructors.slice(0, 1);
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
