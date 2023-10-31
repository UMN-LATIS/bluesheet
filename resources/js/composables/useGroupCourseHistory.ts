import { ref, computed, watch } from "vue";
import { useTerms } from "./useTerms";
import * as api from "@/api";
import type {
  Course,
  Group,
  Instructor,
  Term,
  CourseShortCode,
  // TimelessCourse,
} from "@/types";
import pMap from "p-map";

type CoursesByInstructorAndTermKey = `${Instructor["id"]}-${Term["id"]}`;
type InstructorsByCourseAndTermKey = `${CourseShortCode}-${Term["id"]}`;

// function toTimelessCourse(course: Course): TimelessCourse {
//   return {
//     shortCode: `${course.subject}-${course.catalogNumber}`,
//     subject: course.subject,
//     catalogNumber: course.catalogNumber,
//     title: course.title,
//     courseType: course.courseType,
//     courseLevel: course.courseLevel,
//   };
// }

async function fetchCoursesAndInstructorsForTerm(
  groupId: Group["id"],
  termId: Term["id"],
) {
  const instructorsByCourseAndTermMap = new Map<
    InstructorsByCourseAndTermKey,
    Instructor[]
  >();
  const coursesByInstructorAndTermMap = new Map<
    CoursesByInstructorAndTermKey,
    Course[]
  >();

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

  const instructorsByCourseTerm = ref<
    Map<InstructorsByCourseAndTermKey, Instructor[]>
  >(new Map());
  const coursesByInstructorTerm = ref<
    Map<CoursesByInstructorAndTermKey, Course[]>
  >(new Map());
  const allInstructors = computed(() =>
    [...instructorsByCourseTerm.value.values()].flat(),
  );
  const allCourses = computed(() =>
    [...coursesByInstructorTerm.value.values()].flat(),
  );

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
            coursesByInstructorTerm.value = new Map([
              ...coursesByInstructorTerm.value,
              ...coursesByInstructorAndTermMap,
            ]);
            instructorsByCourseTerm.value = new Map([
              ...instructorsByCourseTerm.value,
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
    allCourses,
    coursesByInstructorTerm,
    instructorsByCourseTerm,
  };
}
