import { describe, expect, it } from "vitest";
import {
  assistantNames,
  assistantsOf,
  initialsOf,
  instructorsOfRecord,
  leadInstructorName,
} from "./sectionPeople";
import type { SisInstructor } from "../types";

const person = (over: Partial<SisInstructor> = {}): SisInstructor => ({
  emplid: 1,
  role: "PI",
  name: "Monica Luciana",
  lastName: "Luciana",
  internetId: "lucia003",
  ...over,
});

describe("instructorsOfRecord", () => {
  it("takes everyone marked PI", () => {
    const people = [
      person(),
      person({ emplid: 2 }),
      person({ emplid: 3, role: "TA" }),
    ];

    expect(instructorsOfRecord(people).map(({ emplid }) => emplid)).toEqual([
      1, 2,
    ]);
  });

  it("falls back to the first instructor who is not an assistant", () => {
    const people = [
      person({ emplid: 9, role: "TA" }),
      person({ emplid: 8, role: "SI" }),
    ];

    expect(instructorsOfRecord(people).map(({ emplid }) => emplid)).toEqual([
      8,
    ]);
  });

  it("names nobody on a section the SIS gave assistants alone", () => {
    const people = [
      person({ emplid: 9, role: "TA" }),
      person({ emplid: 8, role: "TA" }),
    ];

    expect(instructorsOfRecord(people)).toEqual([]);
  });
});

describe("assistantsOf", () => {
  it("leaves out whoever the record list already shows", () => {
    const people = [person(), person({ emplid: 8, role: "SI" })];

    expect(assistantsOf(people).map(({ emplid }) => emplid)).toEqual([8]);
  });

  it("keeps every assistant on a section with no instructor of record", () => {
    const people = [
      person({ emplid: 9, role: "TA" }),
      person({ emplid: 8, role: "TA" }),
    ];

    expect(assistantsOf(people).map(({ emplid }) => emplid)).toEqual([9, 8]);
  });
});

describe("leadInstructorName", () => {
  it("takes the last name of the first instructor of record", () => {
    expect(leadInstructorName([person()])).toBe("Luciana");
  });

  it("says TBA where a discussion carries its assistants alone", () => {
    expect(leadInstructorName([person({ role: "TA" })])).toBe("TBA");
  });
});

describe("assistantNames", () => {
  it("joins the assistants a card has to name", () => {
    const people = [
      person(),
      person({ emplid: 2, role: "TA", lastName: "Ali" }),
      person({ emplid: 3, role: "TA", lastName: "Nguyen" }),
    ];

    expect(assistantNames(people)).toBe("Ali, Nguyen");
  });

  it("is null where there is nobody to name", () => {
    expect(assistantNames([person()])).toBeNull();
  });
});

describe("initialsOf", () => {
  it("takes the first letter of each name", () => {
    expect(initialsOf(person())).toBe("ML");
  });

  it("asks a question of a nameless instructor", () => {
    expect(initialsOf(person({ name: null, lastName: null }))).toBe("?");
  });
});
