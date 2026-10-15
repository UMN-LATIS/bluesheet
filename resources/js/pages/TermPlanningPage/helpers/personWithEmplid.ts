import type { PersonRow } from "./peopleRows";

export type PersonWithEmplid = PersonRow & { emplid: number };

export const hasEmplid = (person: PersonRow): person is PersonWithEmplid =>
  person.emplid !== null;
