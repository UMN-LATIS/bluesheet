import type { Instructor, Term, Course, Leave } from "@/types";
import pMap from "p-map";
import * as api from "@/api";
import { dayjs } from "@/lib";

type TermId = number;

async function getCoursesByTermMap(
  deptId: number,
  terms: Term[],
): Promise<Map<TermId, Course[]>> {
  const coursesByTermMap = new Map<TermId, Course[]>();

  // load couses into map
  await pMap(
    terms,
    (term) => {
      return api
        .getGroupCoursesByTerm({
          termId: term.id,
          groupId: deptId,
        })
        .then((courses) => {
          coursesByTermMap.set(term.id, courses);
        });
    },
    { concurrency: 5 },
  );

  return coursesByTermMap;
}

function sortInstructorsByName(a: Instructor, b: Instructor): number {
  const lastNameCompare = a.surName.localeCompare(b.surName);
  if (lastNameCompare !== 0) {
    return lastNameCompare;
  }
  return a.givenName.localeCompare(b.givenName);
}
export async function useDeptTeachingHistory(deptId: number, terms: Term[]) {
  const coursesByTermMap: Map<TermId, Course[]> = await getCoursesByTermMap(
    deptId,
    terms,
  );

  const allInstructorsMap = new Map<Instructor["id"], Instructor>();
  const termCoursesByInstructorMap = new Map<
    Instructor["id"],
    Map<Term["id"], Course[]>
  >();

  // construct our maps
  for (const [termId, courses] of coursesByTermMap.entries()) {
    for (const course of courses) {
      allInstructorsMap.set(course.instructor.id, course.instructor);

      // get the existing map of term courses for this instructor
      const instructorsTermCourses =
        termCoursesByInstructorMap.get(course.instructor.id) ??
        new Map<Term["id"], Course[]>();

      // add course to instructors term courses
      const instructorsCourses = instructorsTermCourses.get(termId) ?? [];
      instructorsCourses.push(course);
    }
  }

  // now return some getters
  return {
    getInstructors(): Instructor[] {
      return Array.from(allInstructorsMap.values()).sort(sortInstructorsByName);
    },
    getCoursesTaughtByInstructorInTerm(
      instructorId: Instructor["id"],
      termId: Term["id"],
    ): Course[] {
      const instructorsTermCourses =
        termCoursesByInstructorMap.get(instructorId);
      if (!instructorsTermCourses) {
        return [];
      }
      return instructorsTermCourses.get(termId) ?? [];
    },
    getInstructorTermLeaves(
      instructorId: Instructor["id"],
      term: Term,
    ): Leave[] {
      const instructor = allInstructorsMap.get(instructorId);

      return (
        instructor?.leaves?.filter((leave) => {
          const leaveStart = dayjs(leave.start_date);
          const leaveEnd = dayjs(leave.end_date);
          const termStart = dayjs(term.startDate);
          const termEnd = dayjs(term.endDate);

          return (
            termStart.isBetween(leaveStart, leaveEnd, "day", "[]") ||
            termEnd.isBetween(leaveStart, leaveEnd, "day", "[]")
          );
        }) ?? []
      );
    },
  };
}
