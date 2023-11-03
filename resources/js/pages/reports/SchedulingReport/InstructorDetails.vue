<template>
  <div
    :class="{
      'tw-opacity-50 tw-line-through': instructor.course.cancelled,
      'tw-bg-yellow-100':
        !!search.length &&
        doesInstructorNameMatchSearchTerm(instructor, search),
      'tw-rounded-2xl tw-bg-black/5 tw-p-2 tw-pr-4 tw-mb-2': isOpen,
      'tw-rounded-full': !isOpen,
    }"
  >
    <div class="tw-flex tw-items-center tw-gap-1">
      <button
        class="tw-border-none tw-bg-transparent tw-text-neutral-500 tw-rounded-full tw-p-1 tw-flex tw-items-center tw-justify-center"
        @click="isOpen = !isOpen"
      >
        <span class="tw-sr-only">Show More</span>
        <ChevronDownIcon
          :class="{
            'tw-transform -tw-rotate-90': !isOpen,
          }"
        />
      </button>
      <div>
        <RouterLink :to="`/user/${instructor.id}`">
          {{ instructor.surName }}, {{ instructor.givenName }}
        </RouterLink>
        <span class="tw-text-xs tw-text-neutral-500 tw-ml-1">
          {{ instructor.course.enrollmentTotal }}/{{
            instructor.course.enrollmentCap
          }}
        </span>
      </div>
    </div>

    <div
      v-show="isOpen"
      class="tw-text-xs tw-text-neutral-500 tw-flex tw-flex-col tw-pl-7 tw-gap-1"
    >
      <span>
        {{ instructor.title }}
        {{ instructor.jobCode ? `(${instructor.jobCode})` : "" }}
      </span>
      <span>{{ instructor.emplid }}</span>
      <span v-if="instructor.sslApplyEligible">✦ SSL Apply Eligible </span>
      <span v-if="instructor.sslEligible">✦ SSL Eligible</span>
      <span v-if="instructor.midcareerEligible">✦ Midcareer Eligible</span>
      <span>Section {{ instructor.course.classSection }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import type { InstructorWithCourse } from "@/stores/useGroupCourseHistoryStore";
import { doesInstructorNameMatchSearchTerm } from "./doesInstructorNameMatchSearchTerm";

defineProps<{
  instructor: InstructorWithCourse;
  search: string;
}>();

const isOpen = ref(false);
</script>
<style scoped></style>
