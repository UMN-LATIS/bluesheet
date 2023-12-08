<template>
  <div
    v-if="course"
    v-show="isSectionVisible"
    class="course-details tw-px-1"
    :class="{
      'tw-opacity-50 tw-line-through': section.isCancelled,
      'tw-bg-yellow-100': isSectionHighlighted,
      'tw-rounded-md tw-bg-black/5 tw-pl-2 tw-pt-1 tw-pb-2 tw-pr-4 tw-mb-2':
        isOpen,
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
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import * as T from "@/types";
import { ChevronDownIcon } from "@/icons";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";

const props = defineProps<{
  section: T.CourseSection;
}>();

const planningStore = useRootCoursePlanningStore();

const course = computed(() => planningStore.getCourse(props.section.courseId));

const isSectionVisible = computed(() =>
  planningStore.isSectionVisible(props.section),
);

const isOpen = ref(false);

const isSectionHighlighted = computed(
  () =>
    planningStore.filters.search.length &&
    planningStore.isSectionMatchingSearch(props.section),
);
</script>
<style scoped></style>
