<template>
  <tr>
    <Td class="course-column">
      <div>{{ course.title }}</div>
      <div class="tw-text-xs tw-text-neutral-500 tw-flex tw-flex-wrap tw-gap-1">
        <div>{{ course.subject }} {{ course.catalogNumber }}</div>
        •
        <div>{{ course.courseType }}</div>
        •
        <div>{{ course.courseLevel }}</div>
      </div>
    </Td>
    <Td
      v-for="(termInstructors, index) in listOfTermInstructors"
      :key="index"
      class="term-data-column"
      :class="{
        'term-data-column--current': currentTerm?.id === terms[index].id,
        'term-data-column--fall': terms[index].name.includes('Fall'),
      }"
    >
      <div v-for="instructor in termInstructors" :key="instructor.id">
        {{ instructor.surName }}, {{ instructor.givenName }}
      </div>
    </Td>
  </tr>
</template>
<script setup lang="ts">
import { Td } from "@/components/Table";
import LeaveChip from "@/components/LeaveChip.vue";
import { Instructor, Term, Leave, Course, TimelessCourse } from "@/types";
import { doesCourseNumberMatchSearchTerm } from "./doesCourseMatchSearchTerm";
import { doesInstructorNameMatchSearchTerm } from "./doesInstructorNameMatchSearchTerm";

defineProps<{
  course: TimelessCourse;
  search: string;
  terms: Term[];
  listOfTermInstructors: Instructor[][];
  currentTerm: Term | null;
}>();

function isFallTerm(term: Term) {
  return term.name.includes("Fall");
}
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
