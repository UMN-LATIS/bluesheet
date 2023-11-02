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
import { Table } from "@/components/Table";
import CourseTableRow from "./CourseTableRow.vue";
import {
  Term,
  Leave,
  LoadState,
  TimelessCourse,
  CourseShortCode,
} from "@/types";
import ReportTableHeaderRow from "./ReportTableHeaderRow.vue";
import { InstructorWithCourse } from "@/stores/useGroupCourseHistoryStore";

defineProps<{
  terms: Term[];
  courses: TimelessCourse[];
  currentTerm: Term | null;
  getLeavesForInstructorPerTerm: (instructorId: number) => Leave[][];
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
