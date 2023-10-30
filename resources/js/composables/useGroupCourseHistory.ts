import { ref, watch } from "vue";
import { useTerms } from "./useTerms";
import * as api from "@/api";
import type { Course, Group, Instructor, Term } from "@/types";
import pMap from "p-map";

type TeachingAssistant = Instructor;

async function fetchCourseLookupByTerm(
  groupId: Group["id"],
  terms: Term[],
): Promise<Map<Term["id"], Course[]>> {
  const coursesByTermLookup = new Map<Term["id"], Course[]>();

  // first create a lookup of all courses by term
  await pMap(
    terms,
    async (term) => {
      const courses = await api.getGroupCoursesByTerm({
        termId: term.id,
        groupId,
        roles: ["PI", "TA"],
      });
      coursesByTermLookup.set(term.id, courses);
    },
    { concurrency: 5 },
  );

  return coursesByTermLookup;
}

function deriveLookups(coursesByTermLookup: Map<Term["id"], Course[]>) {
  const courseLookup = new Map<Course["classNumber"], Course>();
  const instructorLookup = new Map<Instructor["id"], Instructor>();
  const taLookup = new Map<TeachingAssistant["id"], TeachingAssistant>();

  Array.from(coursesByTermLookup.values())
    .flat()
    .forEach((course) => {
      courseLookup.set(course.classNumber, course);
      course.instructors.forEach((instructor) => {
        if (instructor.instructorRole === "TA") {
          taLookup.set(instructor.id, instructor);
        }
        if (instructor.instructorRole === "PI") {
          instructorLookup.set(instructor.id, instructor);
        }
      });
    });

  return {
    courseLookup,
    instructorLookup,
    taLookup,
  };
}

export function useGroupCourseHistory(groupId: Group["id"]) {
  const { terms } = useTerms();

  const coursesByTermLookup = ref<Map<Term["id"], Course[]>>(new Map());
  const courseLookup = ref<Map<Course["classNumber"], Course>>(new Map());
  const instructorLookup = ref<Map<Instructor["id"], Instructor>>(new Map());
  const taLookup = ref<Map<TeachingAssistant["id"], TeachingAssistant>>(
    new Map(),
  );

  watch(
    [terms],
    async () => {
      if (!terms.value.length) return;

      // first create a course lookup by term
      coursesByTermLookup.value = await fetchCourseLookupByTerm(
        groupId,
        terms.value,
      );

      // then derive lookups for courses, instructors, and tas
      const derivedLookups = deriveLookups(coursesByTermLookup.value);
      courseLookup.value = derivedLookups.courseLookup;
      instructorLookup.value = derivedLookups.instructorLookup;
      taLookup.value = derivedLookups.taLookup;
    },
    { immediate: true },
  );

  return {
    terms,
    courseLookup,
    instructorLookup,
    taLookup,
  };
}
