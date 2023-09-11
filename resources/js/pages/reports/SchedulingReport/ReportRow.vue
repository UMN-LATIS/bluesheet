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
      <div class="tw-text-xs tw-text-neutral-400">
        {{ instructor.emplid }} •
        {{ instructor.academicAppointment }}
      </div>
    </Td>
    <Td
      v-for="(termCourses, index) in listOfTermCourses"
      :key="index"
      :class="{
        'tw-bg-amber-50': currentTerm?.id === terms[index].id,
      }"
    >
      <div class="leaves tw-flex tw-flex-col tw-gap-1 tw-mb-2">
        <LeaveChip
          v-for="leave in listOfTermLeaves[index]"
          :key="leave.id"
          :leave="leave"
        >
          {{ leave.description }} ({{ leave.type }})
        </LeaveChip>
      </div>
      <div
        v-for="course in termCourses"
        v-show="isShowingCourse(course)"
        :key="course.id"
      >
        <div
          class="tw-my-1 tw-px-1"
          :class="{
            'tw-opacity-50 tw-line-through': course.cancelled,
            'tw-bg-yellow-100':
              search.length && doesCourseMatchSearchTerm(course, search),
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

defineProps<{
  instructor: Instructor;
  search: string;
  terms: Term[];
  listOfTermCourses: Course[][];
  listOfTermLeaves: Leave[][];
  isShowingCourse: (course: Course) => boolean;
  currentTerm: Term | null;
}>();

function doesInstructorNameMatchSearchTerm(
  instructor: Instructor,
  searchTerm: string,
) {
  return (
    instructor.surName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.givenName.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

function doesCourseMatchSearchTerm(course: Course, searchTerm: string) {
  const courseTitle =
    `${course.subject} ${course.catalogNumber} ${course.classSection}`.toLowerCase();

  return courseTitle.includes(searchTerm.toLowerCase());
}
</script>
<style scoped></style>
