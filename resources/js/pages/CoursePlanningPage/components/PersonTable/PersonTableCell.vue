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
    <SectionDetails
      v-for="section in publishedSections"
      :key="section.id"
      :section="section"
      :person="person"
    />

    <DragDrop
      :id="`emplid.${person.emplid}-termid.${term.id}`"
      :list="localUnpublishedSections"
      :disabled="!arePlannedSectionsEditable"
      class="tw-flex tw-flex-col tw-gap-1 tw-pb-12 tw-flex-1 tw-h-full group"
      @drop="handeSectionChange"
    >
      <template #item="{ element: section }">
        <SectionDetails
          :section="section"
          :person="person"
          :isUnpublishedEditable="arePlannedSectionsEditable"
          :isUnpublishedViewable="arePlannedSectionsViewable"
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
    </DragDrop>

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
import { watchDebounced } from "@vueuse/core";
import { $can } from "@/utils";
import { DragDrop } from "@/components/DragDrop";
import { DropEvent } from "@/types";

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

// use local course sections to avoid section jumping back
// to original position while api call is made
const localUnpublishedSections = ref<T.CourseSection[]>(
  unpublishedSections.value,
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

function getPreviousPersonFromEvent(
  event: DropEvent<T.CourseSection>,
): T.Person | null {
  // use the source list id to get the person id
  const personInfo = (event.sourceListId as string).split("-")[0];
  const personEmplidStr = personInfo.split(".")[1];
  const personEmplid = Number.parseInt(personEmplidStr);

  // then use the person id to get the person
  return coursePlanningStore.personStore.getPersonByEmplId(personEmplid);
}

async function handeSectionChange(event: DropEvent<T.CourseSection>) {
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

  const updatedSection: T.CourseSection = {
    ...previousSection,
    termId: props.term.id,
  };

  coursePlanningStore.courseSectionStore.updateSection(updatedSection);
  coursePlanningStore.enrollmentStore.createEnrollment({
    person: props.person,
    section: updatedSection,
    role: initialRole.value,
  });

  coursePlanningStore.enrollmentStore.removeEnrollment(previousEnrollment);
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
