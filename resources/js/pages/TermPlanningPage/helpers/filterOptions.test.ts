import { describe, expect, it } from "vitest";
import { buildFilterOptions } from "./filterOptions";
import type { SisInstructor, SisSection } from "../types";
import { TBA_PERSON } from "../types";

const section = (id: number, extra: Partial<SisSection> = {}): SisSection => ({
  id,
  classNumber: 50000 + id,
  termId: 1269,
  courseCode: "ANTH-1001",
  subject: "ANTH",
  catalogNumber: "1001",
  section: "001",
  title: "Understanding Cultures",
  component: "LEC",
  credits: 3,
  enrollmentCap: 30,
  enrollmentTotal: 20,
  waitlistCap: 5,
  waitlistTotal: 0,
  instructors: [],
  meetings: [],
  crosslist: null,
  ...extra,
});

const instructor = (
  emplid: number,
  extra: Partial<SisInstructor> = {},
): SisInstructor => ({
  emplid,
  role: "PI",
  name: "Ana García",
  lastName: "García",
  internetId: "garci001",
  ...extra,
});

describe("buildFilterOptions", () => {
  describe("courseLevels", () => {
    it("groups by catalog number's first digit, sorted ascending with Other last", () => {
      const options = buildFilterOptions([
        section(1, { courseCode: "ANTH-3001", catalogNumber: "3001" }),
        section(2, { courseCode: "ANTH-1001", catalogNumber: "1001" }),
        section(3, { courseCode: "ANTH-XL01", catalogNumber: "XL01" }),
      ]);

      expect(options.courseLevels.map((level) => level.label)).toEqual([
        "1000-level",
        "3000-level",
        "Other",
      ]);
    });

    it("counts sections and takes title and credits from the first section seen", () => {
      const options = buildFilterOptions([
        section(1, {
          courseCode: "ANTH-1001",
          section: "001",
          title: "Understanding Cultures",
          credits: 3,
        }),
        section(2, {
          courseCode: "ANTH-1001",
          section: "002",
          title: "Understanding Cultures (relisted)",
          credits: 4,
        }),
      ]);

      const course = options.courseLevels[0].courses[0];
      expect(course.sectionCount).toBe(2);
      expect(course.title).toBe("Understanding Cultures");
      expect(course.credits).toBe(3);
    });

    it("sorts courses within a level by subject then catalog number", () => {
      const options = buildFilterOptions([
        section(1, {
          courseCode: "GWSS-1001",
          subject: "GWSS",
          catalogNumber: "1001",
        }),
        section(2, {
          courseCode: "ANTH-1050",
          subject: "ANTH",
          catalogNumber: "1050",
        }),
        section(3, {
          courseCode: "ANTH-1001",
          subject: "ANTH",
          catalogNumber: "1001",
        }),
      ]);

      expect(
        options.courseLevels[0].courses.map((course) => course.value),
      ).toEqual(["ANTH-1001", "ANTH-1050", "GWSS-1001"]);
    });
  });

  describe("faculty", () => {
    it("lists PI and SI instructors, not TA-only people, and a PI's TA does not inflate counts", () => {
      const pi = instructor(1, {
        role: "PI",
        name: "Ana García",
        lastName: "García",
      });
      const si = instructor(2, {
        role: "SI",
        name: "Ben Lee",
        lastName: "Lee",
      });
      const ta = instructor(3, {
        role: "TA",
        name: "Cam Diaz",
        lastName: "Diaz",
      });
      const options = buildFilterOptions([
        section(1, { instructors: [pi, ta] }),
        section(2, { instructors: [si] }),
      ]);

      expect(options.faculty.map((person) => person.value)).toEqual(["1", "2"]);
    });

    it("counts one section once even when a person holds two roles on it", () => {
      const person = instructor(1, { role: "PI" });
      const sameSection = instructor(1, { role: "SI" });
      const options = buildFilterOptions([
        section(1, { instructors: [person, sameSection] }),
        section(2, { instructors: [person] }),
      ]);

      expect(options.faculty[0].sectionCount).toBe(2);
    });

    it("carries the emplid and internet id for the detail line", () => {
      const options = buildFilterOptions([
        section(1, { instructors: [instructor(1)] }),
      ]);

      expect(options.faculty[0]).toMatchObject({
        emplid: 1,
        internetId: "garci001",
      });
    });

    it("forms shortName from the first initial and last name", () => {
      const options = buildFilterOptions([
        section(1, {
          instructors: [
            instructor(1, {
              role: "PI",
              name: "Ana García",
              lastName: "García",
            }),
          ],
        }),
      ]);

      expect(options.faculty[0].shortName).toBe("A. García");
    });

    it("falls back to the plain name when there is no last name to pair it with", () => {
      const options = buildFilterOptions([
        section(1, {
          instructors: [
            instructor(1, { role: "PI", name: "Ana García", lastName: null }),
          ],
        }),
      ]);

      expect(options.faculty[0].name).toBe("Ana García");
      expect(options.faculty[0].shortName).toBe("Ana García");
    });

    it("falls back to lastName, then internetId, then emplid when name is missing", () => {
      const options = buildFilterOptions([
        section(1, {
          instructors: [
            instructor(1, { role: "PI", name: null, lastName: "García" }),
            instructor(2, {
              role: "SI",
              name: null,
              lastName: null,
              internetId: "lee0002",
            }),
            instructor(3, {
              role: "PI",
              name: null,
              lastName: null,
              internetId: null,
            }),
          ],
        }),
      ]);

      const names = options.faculty.map((person) => person.name);
      expect(names).toContain("García");
      expect(names).toContain("lee0002");
      expect(names).toContain("3");
    });
  });

  describe("tba", () => {
    it("is null when every section has an instructor", () => {
      const options = buildFilterOptions([
        section(1, { instructors: [instructor(1)] }),
      ]);

      expect(options.tba).toBeNull();
    });

    it("counts the sections with no instructors", () => {
      const options = buildFilterOptions([
        section(1, { instructors: [] }),
        section(2, { instructors: [instructor(1)] }),
        section(3, { instructors: [] }),
      ]);

      expect(options.tba).toEqual({
        value: TBA_PERSON,
        name: "TBA",
        shortName: "TBA",
        emplid: null,
        internetId: null,
        sectionCount: 2,
      });
    });
  });

  describe("sections", () => {
    it("sorts by course code then section, and labels with a middle dot", () => {
      const options = buildFilterOptions([
        section(1, { courseCode: "ANTH-1001", section: "002" }),
        section(2, { courseCode: "ANTH-1001", section: "001" }),
      ]);

      expect(options.sections.map((option) => option.value)).toEqual([
        "2",
        "1",
      ]);
      expect(options.sections[0].label).toBe("ANTH 1001 · 001");
    });

    it("takes the instructor's last name from the PI, else the first instructor", () => {
      const pi = instructor(1, { role: "PI", lastName: "García" });
      const ta = instructor(2, { role: "TA", lastName: "Lee" });
      const options = buildFilterOptions([
        section(1, { id: 1, instructors: [ta, pi] }),
        section(2, { id: 2, instructors: [ta] }),
        section(3, { id: 3, instructors: [] }),
      ]);

      const byId = new Map(
        options.sections.map((option) => [option.value, option]),
      );
      expect(byId.get("1")?.instructorLastName).toBe("García");
      expect(byId.get("2")?.instructorLastName).toBe("Lee");
      expect(byId.get("3")?.instructorLastName).toBeNull();
    });
  });

  describe("components", () => {
    it("sorts by section count descending, then by value", () => {
      const options = buildFilterOptions([
        section(1, { component: "DIS" }),
        section(2, { component: "LEC" }),
        section(3, { component: "LEC" }),
        section(4, { component: "LAB" }),
      ]);

      expect(options.components).toEqual([
        { value: "LEC", sectionCount: 2 },
        { value: "DIS", sectionCount: 1 },
        { value: "LAB", sectionCount: 1 },
      ]);
    });
  });
});
