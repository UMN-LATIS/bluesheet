import { computed } from "vue";
import { Group, Course, TimelessCourse, Instructor } from "@/types";
import {
  useGroupCourseHistory,
  type CoursesByInstructorAndTermKey,
} from "./useGroupCourseHistory";
import { useTerms } from "./useTerms";
import { uniqBy } from "lodash-es";

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

export function useGroupCourses(groupId: Group["id"]) {
  const { coursesByInstructorTermMap, isLoadingComplete, termLoadState } =
    useGroupCourseHistory(groupId);
  const { terms } = useTerms();

  const allCourses = computed(() => {
    const courses: TimelessCourse[] = [
      ...coursesByInstructorTermMap.value.values(),
    ]
      .flat()
      .map(toTimelessCourse);
    // remove duplicates
    return uniqBy(courses, "shortCode");
  });

  const courseTypesMap = computed(() => {
    const map = new Map<Course["courseType"], number>();
    allCourses.value.forEach((course) => {
      const count = map.get(course.courseType) ?? 0;
      map.set(course.courseType, count + 1);
    });
    return map;
  });

  const courseLevelsMap = computed(() => {
    const map = new Map<Course["courseLevel"], number>();
    allCourses.value.forEach((course) => {
      const count = map.get(course.courseLevel) ?? 0;
      map.set(course.courseLevel, count + 1);
    });
    return map;
  });

  return {
    allCourses,
    courseTypesMap,
    courseLevelsMap,
    isLoadingComplete,
    termLoadState,
    getCoursesForInstructorPerTerm(instructorId: Instructor["id"]) {
      return terms.value.map((term) => {
        const key =
          `${instructorId}-${term.id}` as CoursesByInstructorAndTermKey;
        return coursesByInstructorTermMap.value.get(key) ?? [];
      });
    },
  };
}
