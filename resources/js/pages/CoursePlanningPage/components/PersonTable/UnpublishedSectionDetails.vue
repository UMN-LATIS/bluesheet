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
        @click="isShowingEditModal = true"
      >
        Edit
      </MoreMenuItem>
      <MoreMenuItem class="tw-text-red-600" @click="handleRemove">
        Remove
      </MoreMenuItem>
    </MoreMenu>
    <EditDraftSectionModal
      v-if="isInPlanningMode"
      :show="isShowingEditModal"
      :initialPerson="person"
      :initialTerm="term"
      :initialCourse="course"
      @save="handleEditSave"
      @close="isShowingEditModal = false"
    />
  </div>
</template>
<script setup lang="ts">
import * as T from "@/types";
import { DragHandleIcon } from "@/icons";
import { MoreMenu, MoreMenuItem } from "@/components/MoreMenu";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import { computed, ref } from "vue";
import EditDraftSectionModal from "../EditDraftSectionModal.vue";

const props = defineProps<{
  section: T.CourseSection;
  course: T.Course;
  person: T.Person;
}>();

const planningStore = useRootCoursePlanningStore();
const enrollment = computed(() =>
  planningStore.enrollmentStore.getEnrollmentForPersonInSection(
    props.person,
    props.section,
  ),
);
const term = computed(() =>
  planningStore.termsStore.getTerm(props.section.termId),
);

const isInPlanningMode = computed(() => {
  return planningStore.isInPlanningMode && !props.section.isPublished;
});

const isShowingEditModal = ref(false);

function handleEditSave({
  course,
  term,
  person,
}: {
  course: T.Course;
  term: T.Term;
  person: T.Person;
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

  const hasEnrollmentChanged =
    enrollment.value && enrollment.value.emplid !== person.emplid;
  if (hasEnrollmentChanged) {
    const updatedEnrollment: T.Enrollment = {
      ...enrollment.value,
      emplid: person.emplid,
    };
    planningStore.enrollmentStore.updateEnrollment(updatedEnrollment);
  }
}

async function handleRemove() {
  if (!enrollment.value) {
    throw new Error("No enrollment found for section");
  }
  // const confirmed = confirm(
  //   `Are you sure you want to remove ${props.course.subject} ${props.course.catalogNumber}?`,
  // );

  // if (!confirmed) {
  //   return;
  // }

  await planningStore.enrollmentStore.removeEnrollment(enrollment.value);

  const sectionEnrollments =
    planningStore.enrollmentStore.getEnrollmentsBySectionId(props.section.id);

  // if there are still enrollments in the section, don't remove it
  if (sectionEnrollments.length) return;

  await planningStore.removeSection(props.section);
}
</script>
<style scoped></style>
