<template>
  <Table
    class="scheduling-report"
    :stickyFirstColumn="true"
    :stickyHeader="true"
  >
    <template #thead>
      <ReportTableHeaderRow
        :label="label"
        :terms="terms"
        :currentTerm="currentTerm"
        :termLoadStateMap="termLoadStateMap"
      />
    </template>
    <TBody>
      <InstructorTableRow
        v-for="instructor in instructors"
        :key="instructor.id"
        :instructor="instructor"
        :terms="terms"
        :listOfTermCourses="getCoursesForInstructorPerTerm(instructor.id)"
        :listOfTermLeaves="getLeavesForInstructorPerTerm(instructor.id)"
        :currentTerm="currentTerm"
        :search="search"
      />
    </TBody>
  </Table>
</template>
<script setup lang="ts">
import { Table, TBody } from "@/components/Table";
import InstructorTableRow from "./InstructorTableRow.vue";
import { Term, Instructor, Leave, Course, LoadState } from "@/types";
import ReportTableHeaderRow from "./ReportTableHeaderRow.vue";

defineProps<{
  label: string;
  terms: Term[];
  instructors: Instructor[];
  currentTerm: Term | null;
  termLoadStateMap: Map<Term["id"], LoadState>;
  getLeavesForInstructorPerTerm: (instructorId: number) => Leave[][];
  getCoursesForInstructorPerTerm: (instructorId: number) => Course[][];
  search: string;
}>();
</script>
<style scoped></style>
