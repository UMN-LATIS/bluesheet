<template>
  <tr
    class="course-table-leaves-row"
    :class="{
      'course-table-leaves-row--sticky': sticky,
    }"
  >
    <Td> Leaves </Td>
    <Td
      v-for="(leaves, index) in leavesPerTerm"
      :key="index"
      class="term-data-column"
      :class="{
        'term-data-column--current': currentTerm?.id === terms[index].id,
        'term-data-column--fall': terms[index].name.includes('Fall'),
      }"
    >
      <div class="leaves-container tw-flex tw-flex-col tw-gap-1">
        <LeaveChip
          v-for="leave in leaves"
          :key="leave.id"
          :leave="leave"
          :instructor="leave.instructor"
          variant="instructor"
          :class="{
            'tw-bg-yellow-100':
              search.length &&
              doesInstructorNameMatchSearchTerm(leave.instructor, search),
          }"
        />
      </div>
    </Td>
  </tr>
</template>
<script setup lang="ts">
import LeaveChip from "@/components/LeaveChip.vue";
import { Td } from "@/components/Table";
import type { Term, LeaveWithInstructor } from "@/types";
import { doesInstructorNameMatchSearchTerm } from "./doesInstructorNameMatchSearchTerm";

withDefaults(
  defineProps<{
    leavesPerTerm: LeaveWithInstructor[][];
    terms: Term[];
    currentTerm: Term | null;
    sticky: boolean;
    search: string;
  }>(),
  {
    sticky: false,
  },
);
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

.course-table-leaves-row--sticky td:first-child {
  position: sticky;
  top: 2.5rem;
  left: 0;
  background: #fafafa;
  z-index: 2;
  border-right: #eee;
}

.course-table-leaves-row--sticky td {
  position: sticky;
  top: 2.5rem;
  z-index: 1;
  background: #fff;
  border-bottom: 2px solid #eee;
}

.course-table-leaves-row--sticky .leaves-container {
  max-height: 9rem;
  overflow-y: auto;
}
</style>
