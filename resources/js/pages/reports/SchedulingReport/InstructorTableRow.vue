<template>
  <tr class="instructor-table-row">
    <Td class="instructor-column">
      <RouterLink :to="`/user/${instructor.id}`">
        <div
          class="tw-truncate"
          :class="{
            'tw-bg-yellow-100':
              search.length &&
              doesInstructorNameMatchSearchTerm(instructor, search),
          }"
        >
          {{ instructor.surName }}, {{ instructor.givenName }}
        </div>
      </RouterLink>
      <div class="tw-text-xs tw-text-neutral-400 tw-flex tw-flex-col">
        <span class="tw-truncate">
          {{ instructor.title }}
          {{ instructor.jobCode ? `(${instructor.jobCode})` : "" }}
        </span>
        <span>{{ instructor.emplid }}</span>
        <span v-if="instructor.sslApplyEligible">✦ SSL Apply Eligible </span>
        <span v-if="instructor.sslEligible">✦ SSL Eligible</span>
        <span v-if="instructor.midcareerEligible">✦ Midcareer Eligible</span>
      </div>
    </Td>
    <Td
      v-for="(termCourses, index) in listOfTermCourses"
      :key="index"
      class="term-data-column tw-group"
      :class="{
        'term-data-column--current': currentTerm?.id === terms[index].id,
        'term-data-column--fall': terms[index].name.includes('Fall'),
      }"
    >
      <InstructorTableCell
        :instructor="instructor"
        :term="terms[index]"
        :termCourses="termCourses"
        :termLeaves="listOfTermLeaves[index]"
        :currentTerm="currentTerm"
        :search="search"
      />
    </Td>
  </tr>
</template>
<script setup lang="ts">
import { Td } from "@/components/Table";
import { Instructor, Term, Leave, Course } from "@/types";
import { doesInstructorNameMatchSearchTerm } from "./doesInstructorNameMatchSearchTerm";
import InstructorTableCell from "./InstructorTableCell.vue";

defineProps<{
  instructor: Instructor;
  search: string;
  terms: Term[];
  listOfTermCourses: Course[][];
  listOfTermLeaves: Leave[][];
  currentTerm: Term | null;
}>();
</script>
<style scoped>
.term-data-column {
  border-left: 1px solid #f3f3f3;
}

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
.instructor-table-row:hover .instructor-column {
  background-color: #f3f3f3;
}
</style>
