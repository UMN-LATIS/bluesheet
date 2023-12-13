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
      v-for="leave in termLeavesForPerson"
      :key="leave.id"
      :leave="leave"
      :person="person"
    >
      {{ leave.description }} ({{ leave.type }})
    </LeaveChip>

    <Draggable
      :disabled="!isPlannable"
      :list="localCourseSections"
      group="sections"
      itemKey="id"
      ghostClass="ghost"
      class="tw-flex tw-flex-col tw-gap-2 tw-pb-12 tw-flex-1 tw-h-full"
      :class="{
        'tw-bg-neutral-50 tw-rounded tw-p-2 tw-cursor-move': isPlannable,
      }"
      @change="handeSectionChange"
    >
      <template #item="{ element: section }">
        <SectionDetails
          :section="section"
          :person="person"
          :isDraggable="isPlannable"
          :class="{ 'not-draggable': !isPlannable }"
        />
      </template>
    </Draggable>

    <EditDraftSectionModal
      v-if="isShowingAddCourse"
      :initialPerson="person"
      :initialTerm="term"
      :show="isShowingAddCourse"
      @close="isShowingAddCourse = false"
      @save="handleSaveTentativeCourse"
    />
  </div>
</template>
<script setup lang="ts">
import LeaveChip from "../LeaveChip.vue";
import SectionDetails from "./SectionDetails.vue";
import { ref, computed, onMounted } from "vue";
import EditDraftSectionModal from "../EditDraftSectionModal.vue";
import * as T from "@/types";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import Draggable, { type DraggableChangeEvent } from "vuedraggable";
import {
  getElementFromDraggableEvent,
  isDraggableAddedEvent,
  isDraggableRemovedEvent,
} from "@/utils/draggableHelpers";
import { watchDebounced } from "@vueuse/core";

const props = defineProps<{
  person: T.Person;
  term: T.Term;
}>();

const coursePlanningStore = useRootCoursePlanningStore();

const courseSections = computed(() => {
  return coursePlanningStore.getSectionsForEmplIdInTerm(
    props.person.emplid,
    props.term.id,
  );
});

// use local course sections to avoid section jumping back
// to original position while api call is made
const localCourseSections = ref<T.CourseSection[]>(courseSections.value);

watchDebounced(
  courseSections,
  (newCourseSections) => {
    localCourseSections.value = newCourseSections;
  },
  { debounce: 300, maxWait: 1000 },
);

const isShowingAddCourse = ref(false);

const termLeavesForPerson = computed(() =>
  coursePlanningStore.leaveStore
    .getLeavesByPersonId(props.person.id)
    .filter((leave) => leave.termIds?.includes(props.term.id)),
);

const doesTermHavePublishedSections = computed(() => {
  return (
    coursePlanningStore.courseSectionStore
      .getSectionsByTermId(props.term.id)
      .filter((section) => section.isPublished).length > 0
  );
});

const isPlannable = computed(() => {
  return (
    coursePlanningStore.isInPlanningMode && !doesTermHavePublishedSections.value
  );
});

function handleSaveTentativeCourse({ term, course, person }) {
  coursePlanningStore.createSectionWithEnrollee({
    course,
    term,
    person,
    role: "PI",
  });
}

async function handeSectionChange(
  event: DraggableChangeEvent<T.CourseSection>,
) {
  const section = getElementFromDraggableEvent(event);
  if (!section) {
    throw new Error("No section found in event");
  }

  if (isDraggableAddedEvent(event)) {
    coursePlanningStore.courseSectionStore.updateSection({
      ...section,
      termId: props.term.id,
    });

    coursePlanningStore.enrollmentStore.createEnrollment({
      person: props.person,
      section: section,
      role: "PI",
    });
  }

  if (isDraggableRemovedEvent(event)) {
    const enrollment =
      coursePlanningStore.enrollmentStore.getEnrollmentForPersonInSection(
        props.person,
        section,
      );

    if (!enrollment) {
      throw new Error("No enrollment found for person in section");
    }

    coursePlanningStore.enrollmentStore.removeEnrollment(enrollment);
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
