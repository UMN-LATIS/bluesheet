<template>
  <tr>
    <Td class="course-column">
      <div>{{ course.subject }} {{ course.catalogNumber }}</div>
      <div>
        {{ course.title }}
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
defineProps<{
  course: TimelessCourse;
  search: string;
  terms: Term[];
  listOfTermInstructors: Instructor[][];
  currentTerm: Term | null;
}>();
</script>
<style scoped></style>
