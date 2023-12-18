<template>
  <div class="tw-flex tw-flex-col tw-gap-1 tw-h-full">
    <LeaveChip
      v-for="leave in termLeavesForPerson"
      :key="leave.id"
      :leave="leave"
      :person="person"
    >
      {{ leave.description }} ({{ leave.type }})
    </LeaveChip>

    <Draggable
      :disabled="!arePlannedSectionsEditable"
      :list="localCourseSections"
      group="sections"
      itemKey="id"
      ghostClass="ghost"
      class="tw-flex tw-flex-col tw-gap-2 tw-pb-12 tw-flex-1 tw-h-full group"
      :class="{
        'tw-bg-neutral-50 tw-rounded tw-p-2': arePlannedSectionsEditable,
      }"
      @change="handeSectionChange"
    >
      <template #item="{ element: section }">
        <SectionDetails
          :section="section"
          :person="person"
          :isEditable="arePlannedSectionsEditable"
          :isViewable="arePlannedSectionsViewable"
        />
      </template>
      <template #footer>
        <button
          v-if="arePlannedSectionsEditable"
          class="tw-bg-transparent tw-border-1 tw-border-dashed tw-border-black/10 tw-rounded tw-p-2 tw-text-sm tw-text-neutral-400 tw-transition-all tw-hidden group-hover:tw-flex tw-justify-center tw-items-center hover:tw-border-neutral-600 hover:tw-text-neutral-600 tw-leading-none"
          @click="isShowingAddCourse = true"
        >
          + Add Course
        </button>
      </template>
    </Draggable>

    <EditDraftSectionModal
      v-if="isShowingAddCourse"
      :initialPerson="person"
      :initialTerm="term"
      :initialRole="initialRole"
      :show="isShowingAddCourse"
      @close="isShowingAddCourse = false"
      @save="handleSaveTentativeCourse"
    />
  </div>
</template>
<script setup lang="ts">
import LeaveChip from "../LeaveChip.vue";
import SectionDetails from "./SectionDetails.vue";
import { ref, computed } from "vue";
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
import { $can } from "@/utils";

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

const arePlannedSectionsViewable = computed(() => {
  return (
    coursePlanningStore.isInPlanningMode &&
    coursePlanningStore.termsStore.isTermPlannable(props.term.id) &&
    $can("view planned courses")
  );
});

const arePlannedSectionsEditable = computed(() => {
  return arePlannedSectionsViewable.value && $can("edit planned courses");
});

const initialRole = computed(() => {
  // if unset, check the filters to see if we're filtering by a single role
  const filterRoles = coursePlanningStore.filters.includedEnrollmentRoles;
  if (filterRoles.length === 1) {
    return filterRoles[0];
  }

  // otherwise, default to Primary Instructor
  return "PI";
});

function handleSaveTentativeCourse({ term, course, person, role }) {
  coursePlanningStore.createSectionWithEnrollee({
    course,
    term,
    person,
    role,
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
