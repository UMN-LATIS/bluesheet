<template>
  <Table
    class="scheduling-report"
    :stickyFirstColumn="true"
    :stickyHeader="true"
  >
    <template #thead>
      <tr>
        <Th class="instructor-column">Instructor</Th>
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
  </Table>
</template>
<script setup lang="ts">
import { Table, Th } from "@/components/Table";
import InstructorTableRow from "./InstructorTableRow.vue";
import { Term, Instructor, Leave, Course } from "@/types";
import Spinner from "@/components/Spinner.vue";

defineProps<{
  terms: Term[];
  instructors: Instructor[];
  currentTerm: Term | null;
  getLeavesForInstructorPerTerm: (instructorId: number) => Leave[][];
  getCoursesForInstructorPerTerm: (instructorId: number) => Course[][];
  search: string;
}>();
</script>
<style scoped></style>
