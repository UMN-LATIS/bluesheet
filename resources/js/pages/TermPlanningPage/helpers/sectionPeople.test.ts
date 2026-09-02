import { describe, expect, it } from "vitest";
import { assistantsOf, initialsOf, instructorsOfRecord } from "./sectionPeople";
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

  it("falls back to the first instructor when none is marked", () => {
    const people = [
      person({ emplid: 9, role: "TA" }),
      person({ emplid: 8, role: "TA" }),
    ];

    expect(instructorsOfRecord(people).map(({ emplid }) => emplid)).toEqual([
      9,
    ]);
  });
});

describe("assistantsOf", () => {
  it("leaves out whoever the record list already shows", () => {
    const people = [
      person({ emplid: 9, role: "TA" }),
      person({ emplid: 8, role: "TA" }),
    ];

    expect(assistantsOf(people).map(({ emplid }) => emplid)).toEqual([8]);
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
