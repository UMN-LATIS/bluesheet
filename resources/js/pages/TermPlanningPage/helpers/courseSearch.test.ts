import { describe, expect, it } from "vitest";
import { searchCourses } from "./courseSearch";
import type { PlannableCourse } from "../types";

describe("searchCourses", () => {
  const course = (
    courseCode: string,
    title: string,
    source: PlannableCourse["source"] = "sis",
  ): PlannableCourse => {
    const [subject, catalogNumber] = courseCode.split("-");
    return {
      id: courseCode,
      courseCode,
      subject,
      catalogNumber,
      title,
      credits: 3,
      lastOfferedTermId: null,
      source,
    };
  };

  const courses = [
    course("PSY-1001", "Intro Psych"),
    course("PSY-3001", "Brain Science"),
    course("ANTH-1001", "Understanding Cultures"),
  ];

  it("matches a code and a title in one search", () => {
    expect(searchCourses(courses, "psy intro").map(({ id }) => id)).toEqual([
      "PSY-1001",
    ]);
  });

  it("matches on the catalog number alone", () => {
    expect(searchCourses(courses, "3001").map(({ id }) => id)).toEqual([
      "PSY-3001",
    ]);
  });

  it("returns everything when nothing has been typed", () => {
    expect(searchCourses(courses, "  ")).toEqual(courses);
  });
});
