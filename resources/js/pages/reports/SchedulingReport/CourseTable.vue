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
  Leave,
  LoadState,
  Instructor,
  TimelessCourse,
  CourseShortCode,
} from "@/types";
import Spinner from "@/components/Spinner.vue";

defineProps<{
  terms: Term[];
  courses: TimelessCourse[];
  currentTerm: Term | null;
  getLeavesForInstructorPerTerm: (instructorId: number) => Leave[][];
  getInstructorsForCoursePerTerm: (
    courseShortCode: CourseShortCode,
  ) => Instructor[][];
  search: string;
}>();
</script>
<style scoped></style>
