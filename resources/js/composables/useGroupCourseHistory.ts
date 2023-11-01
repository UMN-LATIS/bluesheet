import { ref, computed, watch } from "vue";
import { useTerms } from "./useTerms";
import * as api from "@/api";
import type {
  Course,
  Group,
  Instructor,
  Term,
  CourseShortCode,
  TimelessCourse,
  Leave,
} from "@/types";
import pMap from "p-map";
import { uniqBy } from "lodash";
import { dayjs } from "@/lib";

type CoursesByInstructorAndTermKey = `${Instructor["id"]}-${Term["id"]}`;
type InstructorsByCourseAndTermKey = `${CourseShortCode}-${Term["id"]}`;

export type CoursesByInstructorTermMap = Map<
  CoursesByInstructorAndTermKey,
  Course[]
>;
export type InstructorsByCourseTermMap = Map<
  InstructorsByCourseAndTermKey,
  Instructor[]
>;

function toTimelessCourse(course: Course): TimelessCourse {
  return {
    shortCode: `${course.subject}-${course.catalogNumber}`,
    subject: course.subject,
    catalogNumber: course.catalogNumber,
    title: course.title,
    courseType: course.courseType,
    courseLevel: course.courseLevel,
  };
}

/**
 * for a given term, get the list of leaves for the instructor
 */
function selectInstructorTermLeaves(
  instructor: Instructor,
  term: Term,
): Leave[] {
  return (
    instructor.leaves?.filter((leave) => {
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
}

async function fetchCoursesAndInstructorsForTerm(
  groupId: Group["id"],
  termId: Term["id"],
) {
  const instructorsByCourseAndTermMap: InstructorsByCourseTermMap = new Map();
  const coursesByInstructorAndTermMap: CoursesByInstructorTermMap = new Map();

  const courses = await api.getGroupCoursesByTerm({
    groupId,
    termId,
    roles: ["PI", "TA"],
  });

  courses.forEach((course) => {
    const courseAndTermKey: InstructorsByCourseAndTermKey = `${course.shortCode}-${termId}`;
    const existingInstructors =
      instructorsByCourseAndTermMap.get(courseAndTermKey) ?? [];

    instructorsByCourseAndTermMap.set(courseAndTermKey, [
      ...existingInstructors,
      ...course.instructors,
    ]);
    course.instructors.forEach((instructor) => {
      const instructorAndTermKey: CoursesByInstructorAndTermKey = `${instructor.id}-${termId}`;
      const existingCourses =
        coursesByInstructorAndTermMap.get(instructorAndTermKey) ?? [];
      coursesByInstructorAndTermMap.set(instructorAndTermKey, [
        ...existingCourses,
        course,
      ]);
    });
  });

  return { coursesByInstructorAndTermMap, instructorsByCourseAndTermMap };
}

export function useGroupCourseHistory(groupId: Group["id"]) {
  const { terms, termLookup, currentTerm } = useTerms();

  const instructorsByCourseTermMap = ref<
    Map<InstructorsByCourseAndTermKey, Instructor[]>
  >(new Map());
  const coursesByInstructorTermMap = ref<
    Map<CoursesByInstructorAndTermKey, Course[]>
  >(new Map());
  const allInstructors = computed(() => {
    const instructors = [...instructorsByCourseTermMap.value.values()].flat();
    // remove duplicates
    return uniqBy(instructors, "id");
  });
  const instructorLookup = computed(() => {
    const lookup = new Map<Instructor["id"], Instructor>();
    allInstructors.value.forEach((instructor) => {
      lookup.set(instructor.id, instructor);
    });
    return lookup;
  });

  const allCourses = computed(() => {
    const courses: TimelessCourse[] = [
      ...coursesByInstructorTermMap.value.values(),
    ]
      .flat()
      .map(toTimelessCourse);
    // remove duplicates
    return uniqBy(courses, "shortCode");
  });

  watch(
    terms,
    () => {
      if (!terms.value.length) {
        console.log("useGroupCourseHistory: no terms found");
        return;
      }

      pMap(
        terms.value,
        async (term) => {
          console.log(
            "useGroupCourseHistory: fetching courses for term",
            term.id,
          );
          try {
            const {
              coursesByInstructorAndTermMap,
              instructorsByCourseAndTermMap,
            } = await fetchCoursesAndInstructorsForTerm(groupId, term.id);

            // do this as one batch update to avoid
            // triggering multiple re-renders
            coursesByInstructorTermMap.value = new Map([
              ...coursesByInstructorTermMap.value,
              ...coursesByInstructorAndTermMap,
            ]);
            instructorsByCourseTermMap.value = new Map([
              ...instructorsByCourseTermMap.value,
              ...instructorsByCourseAndTermMap,
            ]);
          } catch (e) {
            console.error(`Cannot fetch courses for term: ${term.name}`, e);
          }
        },
        { concurrency: 3 },
      );
    },
    {
      immediate: true,
      deep: true,
    },
  );

  return {
    terms,
    termLookup,
    currentTerm,
    allInstructors,
    instructorLookup,
    allCourses,
    coursesByInstructorTermMap,
    instructorsByCourseTermMap,

    getCoursesForInstructorPerTerm(instructorId: Instructor["id"]) {
      return terms.value.map((term) => {
        const key =
          `${instructorId}-${term.id}` as CoursesByInstructorAndTermKey;
        return coursesByInstructorTermMap.value.get(key) ?? [];
      });
    },

    getLeavesForInstructorPerTerm(instructorId: Instructor["id"]) {
      const instructor = instructorLookup.value.get(instructorId);
      if (!instructor) {
        throw new Error(`Cannot find instructor with id: ${instructorId}`);
      }

      return terms.value.map((term) =>
        selectInstructorTermLeaves(instructor, term),
      );
    },
  };
}
