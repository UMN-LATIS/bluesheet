<template>
  <tr>
    <Td class="instructor-column">
      <RouterLink :to="`/user/${instructor.id}`">
        <div
          :class="{
            'tw-bg-yellow-100 tw-text-blue-600 ':
              search.length &&
              doesInstructorNameMatchSearchTerm(instructor, search),
          }"
        >
          {{ instructor.surName }}, {{ instructor.givenName }}
        </div>
      </RouterLink>
      <div class="tw-text-xs tw-text-neutral-400 tw-flex tw-flex-col">
        <span>
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
      class="term-data-column"
      :class="{
        'term-data-column--current': currentTerm?.id === terms[index].id,
        'term-data-column--fall': isFallTerm(terms[index]),
      }"
    >
      <div class="leaves tw-flex tw-flex-col tw-gap-1 tw-mb-2">
        <LeaveChip
          v-for="leave in listOfTermLeaves[index]"
          :key="leave.id"
          :leave="leave"
          :instructor="instructor"
        >
          {{ leave.description }} ({{ leave.type }})
        </LeaveChip>
      </div>
      <div v-for="course in termCourses" :key="course.classNumber">
        <div
          class="tw-my-1 tw-px-1"
          :class="{
            'tw-opacity-50 tw-line-through': course.cancelled,
            'tw-bg-yellow-100':
              search.length && doesCourseNumberMatchSearchTerm(course, search),
          }"
        >
          {{ course.subject }} {{ course.catalogNumber }}
          <span class="tw-text-xs tw-text-neutral-400">
            {{ course.enrollmentTotal }}/{{ course.enrollmentCap }}
          </span>
        </div>
      </div>
    </Td>
  </tr>
</template>
<script setup lang="ts">
import { Td } from "@/components/Table";
import LeaveChip from "@/components/LeaveChip.vue";
import { Instructor, Term, Leave, Course } from "@/types";
import { doesCourseNumberMatchSearchTerm } from "./doesCourseMatchSearchTerm";
import { doesInstructorNameMatchSearchTerm } from "./doesInstructorNameMatchSearchTerm";

defineProps<{
  instructor: Instructor;
  search: string;
  terms: Term[];
  listOfTermCourses: Course[][];
  listOfTermLeaves: Leave[][];
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
