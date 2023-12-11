<template>
  <div
    class="tw-bg-neutral-100 tw-py-2 tw-flex tw-gap-1 tw-cursor-move tw-items-top tw-italic"
    :class="{
      'tw-cursor-move tw-shadow': isInPlanningMode,
      'tw-cursor-default tw-px-2': !isInPlanningMode,
    }"
  >
    <DragHandleIcon v-if="isInPlanningMode" class="tw-inline-block" />
    <div class="tw-flex-1 tw-overflow-hidden">
      <h2 class="tw-text-sm tw-m-0">
        {{ course.subject }} {{ course.catalogNumber }}
      </h2>
      <p class="tw-text-xs tw-m-0">
        {{ course.title }}
      </p>
    </div>
    <MoreMenu v-if="isInPlanningMode">
      <MoreMenuItem
        class="tw-flex tw-gap-2 tw-items-center"
        @click="handleEdit"
      >
        Edit
      </MoreMenuItem>
      <MoreMenuItem class="tw-text-red-600" @click="handleRemove">
        Remove
      </MoreMenuItem>
    </MoreMenu>
  </div>
</template>
<script setup lang="ts">
import * as T from "@/types";
import { DragHandleIcon } from "@/icons";
import { MoreMenu, MoreMenuItem } from "@/components/MoreMenu";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import { computed } from "vue";

const props = defineProps<{
  section: T.CourseSection;
  course: T.Course;
  person: T.Person;
}>();

const planningStore = useRootCoursePlanningStore();
const enrollment = computed(() =>
  planningStore.getEnrollmentForPersonInSection(props.person, props.section),
);

const isInPlanningMode = computed(() => {
  return planningStore.isInPlanningMode && !props.section.isPublished;
});

function handleEdit() {
  console.log("edit");
}

function handleRemove() {
  if (!enrollment.value) {
    throw new Error("No enrollment found for section");
  }
  const confirmed = confirm(
    `Are you sure you want to remove ${props.course.subject} ${props.course.catalogNumber}?`,
  );

  if (!confirmed) {
    return;
  }

  // remove section if last enrollment
  if (props.section.enrollments.length === 1) {
    planningStore.removeSection(props.section);
  }

  planningStore.removeEnrollment(enrollment.value);
}
</script>
<style scoped></style>
