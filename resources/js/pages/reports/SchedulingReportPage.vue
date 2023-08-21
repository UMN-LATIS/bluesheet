<template>
  <div>
    <h1>{{ groupId }}</h1>

    <div v-if="group">
      <h2>{{ group.group_title }}</h2>
    </div>

    <Table v-if="termsMap && instructorTermCoursesMap" name="Scheduling Report">
      <template #thead>
        <tr>
          <Th class="instructor-column">Instructor</Th>
          <Th v-for="term in termsSortedByDate" :id="term.TERM">
            {{ term.TERM_DESCRIPTION }}
          </Th>
        </tr>
      </template>
      <tr v-for="instructor in instructorsSortByName" :key="instructor.id">
        <Td class="instructor-column">
          <RouterLink :to="`/user/${instructor.id}`"
            >{{ instructor.surName }}, {{ instructor.givenName }}
          </RouterLink>
        </Td>
        <Td v-for="term in termsSortedByDate">
          <div v-for="leave in selectInstructorTermLeaves(instructor, term)">
            {{ leave.description }} ({{ leave.type }})
          </div>
          <div v-for="course in selectInstructorTermCourses(instructor, term)">
            <div>{{ course.subject }} {{ course.catalogNumber }}</div>
          </div>
        </Td>
      </tr>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, computed } from "vue";
import * as api from "@/api";
import { Course, Term, Group, Instructor, Leave } from "@/types";
import { uniqBy } from "lodash";
import dayjs from "dayjs";
import { Table, Td, Th } from "@/components/Table";

const props = defineProps<{
  groupId: number;
}>();

// key: `term-id`
type InstructorId = number;
type TermId = number;
const group = ref<Group>();
const termsMap = ref<Map<TermId, Term>>(new Map());
const instructorTermCoursesMap = ref<
  Map<`${InstructorId}-${TermId}`, Course[]>
>(new Map());

const instructorsMap = computed((): Map<InstructorId, Instructor> => {
  const allInstructors = new Map<InstructorId, Instructor>();
  instructorTermCoursesMap.value.forEach((courses: Course[]) => {
    courses.forEach((course) => {
      allInstructors.set(course.instructor.id, course.instructor);
    });
  });
  return allInstructors;
});

function sortByName(
  a: { surName: string; givenName: string },
  b: { surName: string; givenName: string },
) {
  return (
    a.surName.localeCompare(b.surName) || a.givenName.localeCompare(b.givenName)
  );
}

const instructorsSortByName = computed(() => {
  return Array.from(instructorsMap.value.values()).sort(sortByName);
});

interface InstructorTerm {
  courses: Course[];
  leaves: Leave[];
}
type InstructorTermKey = `${InstructorId}-${TermId}`;
type InstructorTermMap = Map<InstructorTermKey, InstructorTerm>;
const deptTeachingHistory = computed((): InstructorTermMap => {
  const map: InstructorTermMap = new Map();

  // loop over terms, adding courses and leaves for each instructor
  termsMap.value.forEach((term) => {
    instructorsMap.value.forEach((instructor) => {
      const key: InstructorTermKey = `${instructor.id}-${term.id}`;
      const courses = instructorTermCoursesMap.value.get(key) ?? [];
      const leaves =
        instructor.leaves?.filter((leave) => {
          const leaveStart = dayjs(leave.start_date);
          const leaveEnd = dayjs(leave.end_date);
          const termStart = dayjs(term.TERM_BEGIN_DT);
          const termEnd = dayjs(term.TERM_END_DT);

          return (
            (leaveStart.isBefore(termEnd) && leaveEnd.isAfter(termStart)) ||
            (leaveStart.isSame(termStart) && leaveEnd.isSame(termEnd))
          );
        }) ?? [];

      map.set(key, {
        courses,
        leaves,
      });
    });
  });

  return map;
});

function selectInstructorTermCourses(
  instructor: Instructor,
  term: Term,
): Course[] {
  const key: InstructorTermKey = `${instructor.id}-${term.id}`;
  const instructorTerm = deptTeachingHistory.value.get(key);
  return instructorTerm?.courses ?? [];
}

function selectInstructorTermLeaves(
  instructor: Instructor,
  term: Term,
): Leave[] {
  const key: InstructorTermKey = `${instructor.id}-${term.id}`;
  const instructorTerm = deptTeachingHistory.value.get(key);
  return instructorTerm?.leaves ?? [];
}

const termsSortedByDate = computed((): Term[] => {
  return [...termsMap.value.values()].sort((a, b) => {
    return dayjs(a.TERM_BEGIN_DT).isBefore(dayjs(b.TERM_BEGIN_DT)) ? -1 : 1;
  });
});

// function getInstructorLeavesWithinTerm(
//   instructor: Instructor,
//   term: Term,
// ): Leave[] {
//   const leaves = instructor.leaves?.filter((leave) => {
//     const leaveStart = dayjs(leave.start_date);
//     const leaveEnd = dayjs(leave.end_date);
//     const termStart = dayjs(term.TERM_BEGIN_DT);
//     const termEnd = dayjs(term.TERM_END_DT);

//     return (
//       (leaveStart.isBefore(termEnd) && leaveEnd.isAfter(termStart)) ||
//       (leaveStart.isSame(termStart) && leaveEnd.isSame(termEnd))
//     );
//   });

//   return leaves ?? [];
// }

watch(
  () => props.groupId,
  async () => {
    const [termsResponse, groupResponse] = await Promise.all([
      api.getTerms(),
      api.getGroup(props.groupId),
    ]);

    termsMap.value = new Map(termsResponse.map((term) => [term.id, term]));
    group.value = groupResponse;

    // for each term, get the group courses and update the instructorTermCoursesMap
    termsResponse.forEach(async (term) => {
      console.log({ term });
      const courses = await api.getGroupCoursesByTerm({
        termId: term.TERM,
        groupId: props.groupId,
      });
      courses.forEach((course) => {
        const key: InstructorTermKey = `${course.instructor.id}-${term.id}`;
        const currentCourses = instructorTermCoursesMap.value.get(key) ?? [];
        instructorTermCoursesMap.value.set(key, [...currentCourses, course]);
      });
    });
  },
  { immediate: true },
);
</script>
<style scoped lang="scss">
.scheduling-report {
  position: relative;

  .instructor-column {
    position: sticky;
    left: 0;
    background-color: white;
    z-index: 1;
  }
}
</style>
