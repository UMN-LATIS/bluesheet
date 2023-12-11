<template>
  <div
    class="course-details tw-px-1 tw-flex tw-items-center"
    :class="{
      'tw-opacity-50 tw-line-through': section.isCancelled,
      'tw-rounded-md tw-bg-black/5 tw-pl-2 tw-pt-1 tw-pb-2 tw-pr-4 tw-mb-2':
        isOpen,
      'tw-rounded-md': !isOpen,
    }"
  >
    <div>
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
            {{ section.enrollmentTotal }}/{{ section.enrollmentCap }}
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
        <span>Section {{ section.classSection }}</span>
        <span> {{ course.courseType }} • {{ course.courseLevel }} </span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import * as T from "@/types";
import { ChevronDownIcon } from "@/icons";

defineProps<{
  section: T.CourseSection;
  course: T.Course;
}>();

const isOpen = ref(false);
</script>
<style scoped></style>
