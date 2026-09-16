import { describe, expect, it } from "vitest";
import {
  courseViewOf,
  leaveRowsOf,
  personHistoryRowsOf,
} from "./planningRows";
import { emptyFilters } from "../useLeavePlanningView/viewQuery";
import type { PlanningFilters } from "../useLeavePlanningView/types";
import {
  historyOf,
  leave,
  person,
  section,
  timelineOf,
} from "./planning.fixture";

const filtersWith = (narrowing: Partial<PlanningFilters>): PlanningFilters => ({
  ...emptyFilters(),
  ...narrowing,
});

describe("leaveRowsOf", () => {
  const okafor = person(1, { categories: ["Faculty"] });
  const ito = person(2, { categories: ["Direct Research"] });
  const timeline = timelineOf(
    [okafor, ito],
    [
      leave(1, "2026-09-08", "2026-12-23", { status: "cancelled" }),
      leave(1, "2027-01-19", "2027-05-12", { status: "pending" }),
      leave(2, "2026-09-08", "2026-12-23", { type: "development" }),
    ],
  );

  it("lists each person with their leaves", () => {
    const rows = leaveRowsOf(timeline, emptyFilters());

    expect(rows.map(({ person }) => person.emplid)).toEqual([1, 2]);
    expect(rows[0].leaves).toHaveLength(2);
  });

  it("keeps only the leaves a status filter allows, and drops people left with none", () => {
    const rows = leaveRowsOf(timeline, filtersWith({ status: ["pending"] }));

    expect(rows.map(({ person }) => person.emplid)).toEqual([1]);
    expect(rows[0].leaves.map(({ status }) => status)).toEqual(["pending"]);
  });

  it("narrows people by appointment category", () => {
    const rows = leaveRowsOf(timeline, filtersWith({ category: ["Direct Research"] }));

    expect(rows.map(({ person }) => person.emplid)).toEqual([2]);
  });
});

describe("personHistoryRowsOf", () => {
  const appointedNonTeacher = person(1);
  const pastInstructor = person(2, { hasAppointment: false, categories: [] });
  const teachingAssistant = person(3, { hasAppointment: false, categories: [] });
  const history = historyOf(
    [appointedNonTeacher, pastInstructor, teachingAssistant],
    [
      section("ANTH-1001", 1269, [
        [2, "PI"],
        [3, "TA"],
      ]),
      section("ANTH-3002", 1273, [[2, "SI"]], { component: "LAB" }),
    ],
  );

  it("lists instructors as everyone appointed plus everyone who taught", () => {
    const rows = personHistoryRowsOf(history, [], "instructors", emptyFilters());

    expect(rows.map(({ person }) => person.emplid)).toEqual([1, 2]);
    expect(rows[1].sectionCount).toBe(2);
    expect(rows[1].sectionsByTerm.get(1273)?.[0].courseCode).toBe("ANTH-3002");
  });

  it("lists teaching assistants as only those who held the role", () => {
    const rows = personHistoryRowsOf(history, [], "tas", emptyFilters());

    expect(rows.map(({ person }) => person.emplid)).toEqual([3]);
  });

  it("drops people with no matching section once sections are narrowed", () => {
    const rows = personHistoryRowsOf(
      history,
      [],
      "instructors",
      filtersWith({ component: ["LAB"] }),
    );

    expect(rows.map(({ person }) => person.emplid)).toEqual([2]);
    expect(rows[0].sectionCount).toBe(1);
  });

  it("drops people with no matching leave once leaves are narrowed", () => {
    const rows = personHistoryRowsOf(
      history,
      [leave(1, "2026-09-08", "2026-12-23", { status: "pending" })],
      "instructors",
      filtersWith({ status: ["pending"] }),
    );

    expect(rows.map(({ person }) => person.emplid)).toEqual([1]);
  });
});

describe("courseViewOf", () => {
  const lucia = person(1, { categories: ["Faculty"] });
  const nina = person(2, { categories: ["Students - Instruction"] });
  const history = historyOf(
    [lucia, nina],
    [
      section("ANTH-1003", 1269, [[1, "PI"]]),
      section("ANTH-1003", 1273, [[1, "PI"]], { isPlanned: true }),
      section("ANTH-1001", 1269, [[2, "TA"]], { component: "LAB", section: "011" }),
    ],
  );

  it("groups sections by course, in course order, by term", () => {
    const { courses } = courseViewOf(history, null, emptyFilters());

    expect(courses.map(({ courseCode }) => courseCode)).toEqual([
      "ANTH-1001",
      "ANTH-1003",
    ]);
    expect([...courses[1].sectionsByTerm.keys()]).toEqual([1269, 1273]);
  });

  it("keeps only courses someone chosen teaches", () => {
    const { courses } = courseViewOf(history, null, filtersWith({ person: ["2"] }));

    expect(courses.map(({ courseCode }) => courseCode)).toEqual(["ANTH-1001"]);
  });

  it("pins the people on leave above the courses", () => {
    const timeline = timelineOf([lucia], [leave(1, "2027-01-19", "2027-05-12")]);

    const { onLeave } = courseViewOf(history, timeline, emptyFilters());

    expect(onLeave.map(({ person }) => person.emplid)).toEqual([1]);
  });
});
