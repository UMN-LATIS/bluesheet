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

    <!-- published sections -->
    <PublishedSectionDetails
      v-for="section in publishedSections"
      :key="section.id"
      :section="section"
    />

    <DragDrop
      v-if="arePlannedSectionsViewable"
      :id="`emplid.${person.emplid}-termid.${term.id}`"
      group="person-table"
      :list="unpublishedSections"
      :disabled="!arePlannedSectionsEditable"
      class="tw-flex tw-flex-col tw-gap-1 tw-pb-12 tw-flex-1 tw-h-full tw-group"
      :meta="{ person, term }"
      @drop="handleSectionChange"
    >
      <template #item="{ element: section }">
        <UnpublishedSectionDetails :section="section" :person="person" />
      </template>
      <template #footer>
        <button
          v-if="arePlannedSectionsEditable"
          class="tw-bg-transparent tw-border-1 tw-border-dashed tw-border-black/10 tw-rounded tw-p-2 tw-text-sm tw-text-neutral-400 tw-transition-all tw-hidden group-hover:tw-flex tw-justify-center tw-items-center hover:tw-border-neutral-600 hover:tw-text-neutral-600 tw-leading-none"
          @click="isShowingEditModal = true"
        >
          + Add Course
        </button>
      </template>
    </DragDrop>

    <EditDraftSectionModal
      v-if="isShowingEditModal"
      :initialPerson="person"
      :initialTerm="term"
      :initialRole="initialRole"
      :show="isShowingEditModal"
      @close="isShowingEditModal = false"
      @save="coursePlanningStore.createSectionWithEnrollee"
    />
  </div>
</template>
<script setup lang="ts">
import LeaveChip from "../LeaveChip.vue";
import { ref, computed } from "vue";
import EditDraftSectionModal from "../EditDraftSectionModal.vue";
import * as T from "@/types";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import { $can } from "@/utils";
import { DragDrop } from "@/components/DragDrop";
import { DropEvent } from "@/types";
import PublishedSectionDetails from "./PublishedSectionDetails.vue";
import UnpublishedSectionDetails from "./UnpublishedSectionDetails.vue";

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

const publishedSections = computed(() => {
  return courseSections.value.filter((section) => section.isPublished);
});

const unpublishedSections = computed(() => {
  return courseSections.value.filter((section) => !section.isPublished);
});

const isShowingEditModal = ref(false);

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

interface PersonTableDragDropMeta extends T.DragDropMeta {
  person: T.Person;
  term: T.Term;
}

type PersonTableDropEvent = DropEvent<T.CourseSection, PersonTableDragDropMeta>;

function getPreviousPersonFromEvent(
  event: PersonTableDropEvent,
): T.Person | null {
  return event.sourceListMeta.person as T.Person | null;
}

async function handleSectionChange(event: PersonTableDropEvent) {
  const previousSection = event.item;
  const previousPerson = getPreviousPersonFromEvent(event);

  if (!previousPerson) {
    throw new Error(
      `Could not find person for section ${previousSection.id} in event ${event}`,
    );
  }

  const previousEnrollment =
    coursePlanningStore.enrollmentStore.getEnrollmentForPersonInSection(
      previousPerson,
      previousSection,
    );

  if (!previousEnrollment) {
    throw new Error(
      `Could not find enrollment for person ${props.person.id} in section ${previousSection.id}`,
    );
  }

  // first remove previous enrollment from store so that
  // sections don't jump around while the API call is in flight
  await coursePlanningStore.enrollmentStore.removeEnrollment(
    previousEnrollment,
  );

  // update section with new term if needed
  const updatedSection =
    previousSection.termId !== props.term.id
      ? await coursePlanningStore.courseSectionStore.updateSection({
          ...previousSection,
          termId: props.term.id,
        })
      : previousSection;

  // now that the section has been updated, create a new enrollment
  await coursePlanningStore.enrollmentStore.createEnrollment({
    person: props.person,
    role: previousEnrollment.role,
    section: updatedSection,
  });
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
