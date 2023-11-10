<template>
  <tr>
    <Td class="course-column">
      <div
        :class="{
          'tw-bg-yellow-100':
            search.length && doesCourseNumberMatchSearchTerm(course, search),
        }"
      >
        {{ course.subject }} {{ course.catalogNumber }}
      </div>

      <div class="tw-text-xs tw-text-neutral-500">
        <div>{{ course.title }}</div>
        <div>{{ course.courseType }} • {{ course.courseLevel }}</div>
      </div>
    </Td>
    <Td
      v-for="(termInstructors, index) in instructorsPerTerm"
      :key="index"
      class="term-data-column"
      :class="{
        'term-data-column--current': currentTerm?.id === terms[index].id,
        'term-data-column--fall': terms[index].name.includes('Fall'),
      }"
    >
      <InstructorDetails
        v-for="instructor in termInstructors"
        :key="instructor.id"
        :instructor="instructor"
        :search="search"
      />
    </Td>
  </tr>
</template>
<script setup lang="ts">
import { Td } from "@/components/Table";
import { Term, TimelessCourse, InstructorWithCourse } from "@/types";
import InstructorDetails from "./InstructorDetails.vue";
import { doesCourseNumberMatchSearchTerm } from "./doesCourseMatchSearchTerm";

defineProps<{
  course: TimelessCourse;
  search: string;
  terms: Term[];
  instructorsPerTerm: InstructorWithCourse[][];
  currentTerm: Term | null;
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
