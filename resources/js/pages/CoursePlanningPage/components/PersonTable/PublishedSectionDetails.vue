<template>
  <div
    v-if="course"
    class="course-details tw-px-1 tw-flex tw-items-center"
    :class="{
      'tw-bg-yellow-100': isSectionHighlighted,
    }"
  >
    <div>
      <div
        class="tw-border-none tw-bg-transparent tw-text-neutral-900 tw-rounded-full tw-p-1 tw-flex tw-items-center tw-justify-center tw-gap-2"
        @click="isOpen = !isOpen"
      >
        <span class="tw-sr-only">Show More</span>
        <ChevronDownIcon v-if="isOpen" />
        <ChevronRightIcon v-else />
        <div>
          {{ course.subject }} {{ course.catalogNumber }}
          <span class="tw-text-xs tw-text-neutral-500 tw-ml-1">
            {{ section.enrollmentTotal }}/{{ section.enrollmentCap }}
          </span>
        </div>
      </div>

      <div
        v-if="isOpen"
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
import { ref, computed } from "vue";
import * as T from "@/types";
import { ChevronDownIcon, ChevronRightIcon } from "@/icons";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";

const props = defineProps<{
  section: T.CourseSection;
}>();

const planningStore = useRootCoursePlanningStore();

const course = computed(() =>
  planningStore.courseStore.getCourse(props.section.courseId),
);

const isOpen = ref(false);

const isSectionHighlighted = computed(
  () =>
    planningStore.filters.search.length &&
    planningStore.isSectionMatchingSearch(props.section),
);
</script>
<style scoped></style>
