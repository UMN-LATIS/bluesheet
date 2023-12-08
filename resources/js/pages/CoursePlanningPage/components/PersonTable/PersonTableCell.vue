<template>
  <div class="tw-flex tw-flex-col tw-gap-1">
    <button
      v-if="coursePlanningStore.isInPlanningMode && canTermBePlanned"
      class="tw-bg-transparent tw-border-1 tw-border-dashed tw-border-black/10 tw-rounded tw-p-2 tw-text-sm tw-text-neutral-400 hover:tw-bg-neutral-900 hover:tw-text-neutral-200 tw-block group-hover:tw-visible tw-leading-none"
      @click="isShowingAddCourse = true"
    >
      + Add Course
    </button>
    <LeaveChip
      v-for="leave in termLeaves"
      :key="leave.id"
      :leave="leave"
      :person="person"
    >
      {{ leave.description }} ({{ leave.type }})
    </LeaveChip>

    <SectionDetails
      v-for="section in courseSections"
      :key="section.id"
      :section="section"
    />

    <AddTentativeCourseModal
      v-if="isShowingAddCourse"
      :initialPerson="person"
      :initialTerm="term"
      :show="isShowingAddCourse"
      @close="isShowingAddCourse = false"
    />
  </div>
</template>
<script setup lang="ts">
import LeaveChip from "../LeaveChip.vue";
import SectionDetails from "./SectionDetails.vue";
import { Term } from "@/types";
import { ref, computed } from "vue";
import AddTentativeCourseModal from "../AddTentativeSectionModal.vue";
import { Person } from "../../coursePlanningTypes";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";

const props = defineProps<{
  person: Person;
  term: Term;
}>();

const coursePlanningStore = useRootCoursePlanningStore();

const courseSections = computed(() =>
  coursePlanningStore.getSectionsForEmplIdInTerm(
    props.person.emplid,
    props.term.id,
  ),
);

const isShowingAddCourse = ref(false);

const termLeaves = computed(() =>
  coursePlanningStore.getLeavesForPersonInTerm(props.person.id, props.term.id),
);

const canTermBePlanned = computed(() =>
  coursePlanningStore.canTermBePlanned(props.term.id),
);
</script>
<style scoped></style>
