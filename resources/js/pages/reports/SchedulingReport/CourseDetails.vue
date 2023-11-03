<template>
  <div
    class="course-details tw-px-1"
    :class="{
      'tw-opacity-50 tw-line-through': course.cancelled,
      'tw-bg-yellow-100':
        !!search.length && doesCourseNumberMatchSearchTerm(course, search),
      'tw-rounded-2xl tw-bg-black/5 tw-p-2 tw-pr-4 tw-mb-2': isOpen,
      'tw-rounded-full': !isOpen,
    }"
  >
    <button
      class="tw-border-none tw-bg-transparent tw-text-neutral-900 tw-rounded-full tw-p-1 tw-flex tw-items-center tw-justify-center tw-gap-2"
      @click="isOpen = !isOpen"
    >
      <span class="tw-sr-only">Show More</span>
      <ChevronDownIcon
        :class="{
          'tw-transform -tw-rotate-90': !isOpen,
        }"
      />
      <div>
        {{ course.subject }} {{ course.catalogNumber }}
        <span class="tw-text-xs tw-text-neutral-500 tw-ml-1">
          {{ course.enrollmentTotal }}/{{ course.enrollmentCap }}
        </span>
      </div>
    </button>

    <div
      v-show="isOpen"
      class="tw-flex tw-flex-col tw-pl-7 tw-gap-1 tw-text-xs tw-text-neutral-500"
    >
      <div class="tw-font-semibold tw-truncate">
        {{ course.title }}
      </div>
      <span>Section {{ course.classSection }}</span>
      <span> {{ course.courseType }} • {{ course.courseLevel }} </span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { Course } from "@/types";
import { doesCourseNumberMatchSearchTerm } from "./doesCourseMatchSearchTerm";
import { ChevronDownIcon } from "@/icons";

defineProps<{
  course: Course;
  search: string;
}>();

const isOpen = ref(false);
</script>
<style scoped></style>
