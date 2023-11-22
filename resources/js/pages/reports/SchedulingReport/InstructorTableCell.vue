<template>
  <div class="tw-flex tw-flex-col tw-gap-1">
    <button
      v-if="groupCourseHistoryStore.isInPlanningMode"
      class="tw-bg-transparent tw-border-1 tw-border-dashed tw-border-black/10 tw-rounded tw-p-2 tw-text-sm tw-text-neutral-400 hover:tw-bg-neutral-900 hover:tw-text-neutral-200 tw-block group-hover:tw-visible tw-leading-none"
      @click="isShowingAddCourse = true"
    >
      + Add Course
    </button>
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

    <AddPlannedCourseModal
      v-if="isShowingAddCourse"
      :terms="groupCourseHistoryStore.allTerms"
      :courses="groupCourseHistoryStore.allCourses"
      :instructors="groupCourseHistoryStore.allInstructors"
      :initialInstructor="instructor"
      :initialTerm="term"
      :show="isShowingAddCourse"
      @close="isShowingAddCourse = false"
    />
  </div>
</template>
<script setup lang="ts">
import LeaveChip from "@/components/LeaveChip.vue";
import CourseDetails from "./CourseDetails.vue";
import { type ComboBoxOption } from "@/components/ComboBox2.vue";
import { Instructor, Term, Leave, Course, TimelessCourse } from "@/types";
import { useGroupCourseHistoryStore } from "@/stores/useGroupCourseHistoryStore";
import { ref, computed } from "vue";
import AddPlannedCourseModal from "./AddPlannedCourseModal.vue";

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
