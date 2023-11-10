<template>
  <Table :stickyHeader="true" :stickyFirstColumn="true">
    <template #thead>
      <ReportTableHeaderRow
        :label="`Courses`"
        :terms="terms"
        :currentTerm="currentTerm"
        :termLoadStateMap="termLoadStateMap"
      />
    </template>
    <TBody>
      <CourseTableLeavesRow
        :leavesPerTerm="leavesPerTerm"
        :terms="terms"
        :currentTerm="currentTerm"
        :sticky="false"
        :search="search"
      />
      <CourseTableCourseRow
        v-for="course in courses"
        :key="course.shortCode"
        :course="course"
        :terms="terms"
        :instructorsPerTerm="getInstructorsForCoursePerTerm(course.shortCode)"
        :currentTerm="currentTerm"
        :search="search"
      />
    </TBody>
  </Table>
</template>
<script setup lang="ts">
import { Table, TBody } from "@/components/Table";
import CourseTableCourseRow from "./CourseTableCourseRow.vue";
import CourseTableLeavesRow from "./CourseTableLeavesRow.vue";
import {
  Term,
  LoadState,
  TimelessCourse,
  CourseShortCode,
  InstructorWithCourse,
  LeaveWithInstructor,
} from "@/types";
import ReportTableHeaderRow from "./ReportTableHeaderRow.vue";

defineProps<{
  terms: Term[];
  courses: TimelessCourse[];
  currentTerm: Term | null;
  leavesPerTerm: LeaveWithInstructor[][];
  getInstructorsForCoursePerTerm: (
    courseShortCode: CourseShortCode,
  ) => InstructorWithCourse[][];
  search: string;
  termLoadStateMap: Map<Term["id"], LoadState>;
}>();
</script>
<style scoped>
.term-data-column.term-data-column--current {
  background: #fffcf0;
  border-top: 1px solid #fde68a;
}

.term-data-column.term-data-column--current.term-data-column--fall {
  border-left: 2px solid #fde68a;
}

.term-data-column.term-data-column--fall {
  border-left: 2px solid #f3f3f3;
}
</style>
