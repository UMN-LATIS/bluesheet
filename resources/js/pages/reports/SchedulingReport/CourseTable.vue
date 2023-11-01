<template>
  <Table :stickyHeader="true" :stickyFirstColumn="true">
    <template #thead>
      <tr>
        <Th class="course-column">Course</Th>
        <Th
          v-for="term in terms"
          :id="`term-${term.id}`"
          :key="term.id"
          class="tw-whitespace-nowrap term-header-column"
          :class="{
            '!tw-bg-amber-100 !tw-border-amber-300 term-header-column--is-current-term':
              term.id === currentTerm?.id,
            'term-header-column--is-fall-term': term.name.includes('Fall'),
          }"
        >
          {{ term.name }}
          <Spinner
            v-if="isTermLoaded(term.id)"
            class="tw-text-neutral-300 tw-h-4 tw-w-4"
          />
        </Th>
      </tr>
    </template>
    <CourseTableRow
      v-for="course in courses"
      :key="course.shortCode"
      :course="course"
      :terms="terms"
      :listOfTermInstructors="getInstructorsForCoursePerTerm(course.shortCode)"
      :currentTerm="currentTerm"
      :search="search"
    />
  </Table>
</template>
<script setup lang="ts">
import { Table, Th } from "@/components/Table";
import CourseTableRow from "./CourseTableRow.vue";
import {
  Term,
  Course,
  Leave,
  LoadState,
  Instructor,
  TimelessCourse,
  CourseShortCode,
} from "@/types";
import Spinner from "@/components/Spinner.vue";

const props = defineProps<{
  terms: Term[];
  courses: TimelessCourse[];
  currentTerm: Term | null;
  termLoadState: Map<Term["id"], LoadState>;
  getLeavesForInstructorPerTerm: (instructorId: number) => Leave[][];
  getInstructorsForCoursePerTerm: (
    courseShortCode: CourseShortCode,
  ) => Instructor[][];
  search: string;
}>();

function isTermLoaded(termId: number) {
  const termLoadState = props.termLoadState.get(termId);
  if (!termLoadState) {
    throw new Error(`Term load state not found for term ${termId}`);
  }
  return ["idle", "loading"].includes(termLoadState);
}
</script>
<style scoped></style>
