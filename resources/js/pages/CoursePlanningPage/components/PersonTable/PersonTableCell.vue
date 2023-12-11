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
      @change="handeSectionChange($event, { person, term })"
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
import { ref, computed } from "vue";
import AddTentativeCourseModal from "../AddTentativeSectionModal.vue";
import * as T from "@/types";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import Draggable, { type DraggableChangeEvent } from "vuedraggable";
import {
  getElementFromDraggableEvent,
  isDraggableAddedEvent,
  isDraggableRemovedEvent,
} from "@/utils/draggableHelpers";

const props = defineProps<{
  person: T.Person;
  term: T.Term;
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

async function handeSectionChange(
  event: DraggableChangeEvent<T.CourseSection>,
  ctx: { person: T.Person; term: T.Term },
) {
  console.log("handleSectionChange", { event, ctx });
  const section = getElementFromDraggableEvent(event);
  if (!section) {
    throw new Error("No section found in event");
  }

  if (isDraggableAddedEvent(event)) {
    await coursePlanningStore.updateSection({
      ...section,
      termId: ctx.term.id,
    });

    await coursePlanningStore.createEnrollment({
      person: ctx.person,
      section,
      role: "PI",
    });
    return;
  }

  if (isDraggableRemovedEvent(event)) {
    const enrollment = coursePlanningStore.getEnrollmentForPersonInSection(
      ctx.person,
      section,
    );

    if (!enrollment) {
      throw new Error("No enrollment found for person in section");
    }

    await coursePlanningStore.removeEnrollment(enrollment);
  }
}
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
