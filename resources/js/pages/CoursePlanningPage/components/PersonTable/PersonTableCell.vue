<template>
  <div class="tw-flex tw-flex-col tw-gap-1 tw-h-full">
    <button
      v-if="isPlannable"
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

    <Draggable
      :disabled="!isPlannable"
      :list="courseSections"
      group="sections"
      itemKey="id"
      ghostClass="ghost"
      class="tw-flex tw-flex-col tw-gap-1 tw-pb-12 tw-flex-1 tw-h-full"
      :class="{
        'tw-opacity-50': !isPlannable,
        'tw-bg-neutral-50 tw-rounded tw-p-2 tw-cursor-move': isPlannable,
      }"
    >
      <template #item="{ element: section }">
        <SectionDetails
          :section="section"
          :class="{ 'not-draggable': !isPlannable }"
        />
      </template>
    </Draggable>

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
import { Person } from "@/types";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import Draggable from "vuedraggable";

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

const isPlannable = computed(() => {
  return (
    coursePlanningStore.isInPlanningMode &&
    coursePlanningStore.canTermBePlanned(props.term.id)
  );
});
</script>
<style scoped>
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.not-draggable {
  cursor: no-drop;
}
</style>
