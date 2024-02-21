<template>
  <div v-if="isUnpublishedViewable && course && enrollment">
    <DraggableCard
      :isDraggable="isUnpublishedEditable"
      :isEditable="isUnpublishedEditable"
      :class="{
        'tw-bg-yellow-100': isSectionHighlighted,
      }"
      @click:remove="handleRemove"
      @click:edit="isShowingEditModal = true"
    >
      <h2 class="tw-text-sm tw-m-0">
        {{ course.subject }} {{ course.catalogNumber }}
        <span
          v-if="isLocalCourse"
          class="tw-italic tw-text-xs tw-text-neutral-500"
        >
          (Draft Course)
        </span>
      </h2>
      <p class="tw-text-xs tw-m-0">
        {{ course.title }}
      </p>
    </DraggableCard>
    <EditDraftSectionModal
      :show="isShowingEditModal"
      :initialPerson="props.person"
      :initialTerm="term"
      :initialCourse="course"
      :initialRole="enrollment.role"
      @save="handleEditSave"
      @close="isShowingEditModal = false"
    />
  </div>
</template>
<script setup lang="ts">
import * as T from "@/types";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import { computed, ref } from "vue";
import { $can } from "@/utils";
import DraggableCard from "@/components/DraggableCard.vue";
import EditDraftSectionModal from "../EditDraftSectionModal.vue";

const props = defineProps<{
  section: T.CourseSection;
  person: T.Person;
}>();

const planningStore = useRootCoursePlanningStore();
const term = computed(() =>
  planningStore.termsStore.getTerm(props.section.termId),
);
const course = computed(() =>
  planningStore.courseStore.getCourse(props.section.courseId),
);

// new unofficial course that only exists in our local db, doesn't
// show up in the SIS
const isLocalCourse = computed(() => course.value?.source === "local" ?? false);

const enrollment = computed(() =>
  planningStore.enrollmentStore.getEnrollmentForPersonInSection(
    props.person,
    props.section,
  ),
);

const isUnpublishedViewable = computed(() => {
  return (
    planningStore.isInPlanningMode &&
    planningStore.termsStore.isTermPlannable(props.section.termId) &&
    $can("view planned courses")
  );
});

const isUnpublishedEditable = computed(() => {
  return isUnpublishedViewable.value && $can("edit planned courses");
});

const isShowingEditModal = ref(false);

const isSectionHighlighted = computed(
  () =>
    planningStore.filters.search.length &&
    planningStore.isSectionMatchingSearch(props.section),
);

function handleEditSave({
  course,
  term,
  person,
  role,
}: {
  course: T.Course;
  term: T.Term;
  person: T.Person;
  role: T.EnrollmentRole;
}) {
  const hasSectionChanged =
    course.id !== props.section.courseId || term.id !== props.section.termId;

  if (hasSectionChanged) {
    const updatedSection: T.CourseSection = {
      ...props.section,
      courseId: course.id,
      termId: term.id,
      isPublished: false,
    };

    planningStore.courseSectionStore.updateSection(updatedSection);
  }

  if (!enrollment.value) {
    throw new Error("No enrollment found for section");
  }

  const hasEnrollmentChanged =
    enrollment.value.emplid !== person.emplid || enrollment.value.role !== role;
  if (hasEnrollmentChanged) {
    const updatedEnrollment: T.Enrollment = {
      ...enrollment.value,
      emplid: person.emplid,
      role,
    };
    planningStore.enrollmentStore.updateEnrollment(updatedEnrollment);
  }
}

async function handleRemove() {
  if (!enrollment.value) {
    throw new Error("No enrollment found for section");
  }

  await planningStore.enrollmentStore.removeEnrollment(enrollment.value);

  const sectionEnrollments =
    planningStore.enrollmentStore.getEnrollmentsBySectionId(props.section.id);

  // if there are still enrollments in the section, don't remove it
  if (sectionEnrollments.length) return;

  await planningStore.removeSection(props.section);
}
</script>
<style scoped></style>
