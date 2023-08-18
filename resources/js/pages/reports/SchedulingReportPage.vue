<template>
  <div>
    <h1>{{ groupId }}</h1>

    <div v-if="group">
      <h2>{{ group.group_title }}</h2>
    </div>

    <table v-if="terms && courses" class="table">
      <thead>
        <tr>
          <th>Instructor</th>
          <th>Fall 2023</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="instructor in instructors" :key="instructor.id">
          <td>{{ instructor.surName }}, {{ instructor.givenName }}</td>
          <td>
            <table>
              <tr v-for="course in instructorTermMap.get(instructor.id)">
                <td>{{ course.title }}</td>
              </tr>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, computed } from "vue";
import * as api from "@/api";
import { Course, Term, Group } from "@/types";
import { uniqBy } from "lodash";
import dayjs from "dayjs";

const props = defineProps<{
  groupId: number;
}>();

const terms = ref<Term[]>([]);
const courses = ref<Course[]>([]);
const group = ref<Group>();

function sortByName(
  a: { surName: string; givenName: string },
  b: { surName: string; givenName: string },
) {
  return (
    a.surName.localeCompare(b.surName) || a.givenName.localeCompare(b.givenName)
  );
}

const instructors = computed(() => {
  const allInstructors = courses.value.map((course) => course.instructor);
  return uniqBy(allInstructors, "id").sort(sortByName);
});

// returns  map of instructor id to a list of courses taught in
// a given term
const instructorTermMap = computed(() => {
  const map = new Map<number, Course[]>();
  for (const instructor of instructors.value) {
    const coursesTaught = courses.value.filter(
      (course) => course.instructor.id === instructor.id,
    );
    map.set(instructor.id, coursesTaught);
  }
  return map;
});

function getCurrentTermCode() {
  const now = dayjs();
  const month = now.month();
  // Jan - Apr: SP
  if (0 <= month && month <= 3) {
    return `SP`;
  }
  // May - Jul: SU
  if (4 <= month && month <= 6) {
    return `SU`;
  }

  return "FA";
}

function getCurrentYear() {
  return dayjs().year();
}

watch(
  () => props.groupId,
  async () => {
    [terms.value, courses.value, group.value] = await Promise.all([
      api.getTerms(),
      api.getGroupCoursesByTerm({
        groupId: props.groupId,
        termCode: getCurrentTermCode(),
        year: getCurrentYear(),
      }),
      api.getGroup(props.groupId),
    ]);
  },
  { immediate: true },
);
</script>
