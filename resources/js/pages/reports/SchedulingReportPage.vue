<template>
  <div>
    <div v-if="group" class="tw-mt-8 tw-mb-16">
      <h2>{{ group.group_title }}</h2>
    </div>

    <Table
      class="scheduling-report"
      v-if="instructorTermCoursesMap"
      name="Scheduling Report"
      :sticky-first-column="true"
      :sticky-header="true"
    >
      <template #thead>
        <tr>
          <Th class="instructor-column">Instructor</Th>
          <Th
            v-for="term in termsSortedByDate"
            :id="term.id"
            class="tw-whitespace-nowrap"
          >
            {{ term.name }}
          </Th>
        </tr>
      </template>
      <tr v-for="instructor in instructorsSortByName" :key="instructor.id">
        <Td class="instructor-column">
          <RouterLink :to="`/user/${instructor.id}`"
            >{{ instructor.surName }}, {{ instructor.givenName }}
          </RouterLink>
        </Td>
        <Td v-for="(term, termIndex) in termsSortedByDate">
          <div class="leaves tw-flex tw-flex-col tw-gap-1 tw-mb-2">
            <LeaveChip
              v-for="leave in selectInstructorTermLeaves(instructor, term)"
              :key="leave.id"
              :leave="leave"
            >
              {{ leave.description }} ({{ leave.type }})
            </LeaveChip>
          </div>
          <div v-for="course in selectInstructorTermCourses(instructor, term)">
            <div
              class="tw-my-1 tw-px-1"
              :class="{
                'tw-opacity-50 tw-line-through': course.cancelled,
              }"
            >
              {{ course.subject }} {{ course.catalogNumber }}
              {{ course.classSection }}
            </div>
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
import dayjs from "dayjs";
import { Table, Td, Th } from "@/components/Table";
import LeaveChip from "@/components/LeaveChip.vue";

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
          const termStart = dayjs(term.startDate);
          const termEnd = dayjs(term.endDate);

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
  const courses = instructorTerm?.courses ?? [];
  return [...courses].sort((a, b) => {
    return (
      a.subject.localeCompare(b.subject) ||
      String(a.catalogNumber).localeCompare(String(b.catalogNumber)) ||
      a.classSection.localeCompare(b.classSection)
    );
  });
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
    return dayjs(a.startDate).isBefore(dayjs(b.startDate)) ? -1 : 1;
  });
});

watch(
  () => props.groupId,
  async () => {
    const [termsResponse, groupResponse] = await Promise.all([
      api.getTerms(),
      api.getGroup(props.groupId),
    ]);

    group.value = groupResponse;

    // for each term, get the group courses and update the instructorTermCoursesMap
    termsResponse.forEach(async (term) => {
      // only get terms that between 3 years ago and 2 years from now
      const termStart = dayjs(term.startDate);
      const termEnd = dayjs(term.endDate);
      const threeYearsAgo = dayjs().subtract(3, "year");
      const twoYearsFromNow = dayjs().add(2, "year");
      if (
        termStart.isBefore(threeYearsAgo) ||
        termEnd.isAfter(twoYearsFromNow)
      ) {
        return;
      }

      termsMap.value.set(term.id, term);

      const courses = await api.getGroupCoursesByTerm({
        termId: term.id,
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
<style scoped lang="scss"></style>
