<template>
  <div>
    <h1>{{ groupId }}</h1>

    <div v-if="group">
      <h2>{{ group.group_title }}</h2>
    </div>

    // create a table of instructors and the courses they teach by term
    <table>
      <thead>
        <tr>
          <th>Instructor</th>
          <th v-for="term in terms" :key="term.TERM">
            {{ term.TERM_DESCRIPTION }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="instructor in instructors" :key="instructor.id">
          <td>{{ instructor.givenName }} {{ instructor.surName }}</td>
          <td v-for="term in terms" :key="term.TERM">
            <ul>
              <li v-for="course in courses" :key="course.id">
                <div>{{ course.subject }} {{ course.catalogNumber }}</div>
                <div>{{ course.title }}</div>
              </li>
            </ul>
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
