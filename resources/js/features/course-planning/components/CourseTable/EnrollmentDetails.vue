<template>
  <div
    v-if="isEnrollmentVisible && person && section"
    class="instructor-details tw-truncate"
    :class="{
      'tw-opacity-50 tw-line-through': section.status === 'cancelled',
      'tw-bg-yellow-100': false,
      'tw-rounded-md tw-bg-black/5 tw-p-2 tw-pr-4 tw-mb-2': isOpen,
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
        <RouterLink :to="`/user/${person.id}`">
          {{ person.surName }}, {{ person.givenName }}
        </RouterLink>
        <span class="tw-text-xs tw-text-neutral-500 tw-ml-1">
          {{ section.enrollmentTotal }}/{{ section.enrollmentCap }}
        </span>
      </div>
    </div>

    <div
      v-show="isOpen"
      class="tw-text-xs tw-text-neutral-500 tw-flex tw-flex-col tw-pl-7 tw-gap-1"
    >
      <span>
        {{ person.title }}
        {{ person.jobCode ? `(${person.jobCode})` : "" }}
      </span>
      <span>{{ person.emplid }}</span>
      <span v-if="person.sslApplyEligible">✦ SSL Apply Eligible </span>
      <span v-if="person.sslEligible">✦ SSL Eligible</span>
      <span v-if="person.midcareerEligible">✦ Midcareer Eligible</span>
      <span>Section {{}}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import * as T from "../../coursePlanningTypes";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
// import { doesInstructorNameMatchSearchTerm } from "./doesInstructorNameMatchSearchTerm";

const props = defineProps<{
  enrollment: T.Enrollment;
}>();

const coursePlanningStore = useRootCoursePlanningStore();
const isOpen = ref(false);

const person = computed((): T.Person | null =>
  coursePlanningStore.getPersonByEmplId(props.enrollment.emplId),
);

const section = computed((): T.CourseSection | null =>
  coursePlanningStore.getSection(props.enrollment.sectionId),
);

const isEnrollmentVisible = computed(() => {
  if (!person.value || !section.value) {
    return false;
  }
  return (
    coursePlanningStore.isPersonVisible(person.value) &&
    coursePlanningStore.isSectionVisible(section.value)
  );
});
</script>
<style scoped></style>
