<template>
  <div class="tw-flex tw-flex-col tw-gap-1">
    <LeaveChip
      v-for="leave in termLeaves"
      :key="leave.id"
      :leave="leave"
      :instructor="instructor"
    >
      {{ leave.description }} ({{ leave.type }})
    </LeaveChip>

    <CourseDetails
      v-for="course in termCourses"
      :key="course.classNumber"
      :course="course"
      :search="search"
    />
    <button
      v-if="groupCourseHistoryStore.isInPlanningMode"
      class="tw-bg-black/10 tw-border-1 tw-border-dashed tw-border-black/10 tw-rounded tw-p-2 tw-text-sm tw-text-neutral-500 hover:tw-bg-neutral-900 hover:tw-text-neutral-200 tw-invisible tw-flex group-hover:tw-visible tw-justify-center tw-items-center"
      @click="isShowingAddCourse = true"
    >
      Add
    </button>
    <div v-if="isShowingAddCourse">
      <ComboBox v-model="selectedCourse" :options="selectCourseOptions" />
    </div>
  </div>
</template>
<script setup lang="ts">
import LeaveChip from "@/components/LeaveChip.vue";
import CourseDetails from "./CourseDetails.vue";
import ComboBox, { type ComboBoxOption } from "@/components/ComboBox.vue";
import { Instructor, Term, Leave, Course, TimelessCourse } from "@/types";
import { useGroupCourseHistoryStore } from "@/stores/useGroupCourseHistoryStore";
import { ref, computed } from "vue";

defineProps<{
  instructor: Instructor;
  term: Term;
  termCourses: Course[];
  termLeaves: Leave[];
  currentTerm: Term | null;
  search: string;
}>();

const groupCourseHistoryStore = useGroupCourseHistoryStore();
const isShowingAddCourse = ref(false);
const selectedCourse = ref<ComboBoxOption | null>(null);

const selectCourseOptions = computed((): ComboBoxOption[] => {
  return groupCourseHistoryStore.allCourses.map((c: TimelessCourse) => ({
    id: c.shortCode,
    label: c.shortCode,
    secondaryLabel: c.title,
  }));
});
</script>
<style scoped></style>
