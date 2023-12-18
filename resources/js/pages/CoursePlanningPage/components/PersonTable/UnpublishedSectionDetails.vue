<template>
  <div
    class="tw-bg-neutral-100 tw-py-2 tw-flex tw-gap-1 tw-items-top tw-italic tw-rounded"
    :class="{
      'tw-cursor-move tw-shadow': isEditable,
      'tw-cursor-default tw-px-2': !isEditable,
    }"
  >
    <DragHandleIcon v-if="isEditable" class="tw-inline-block" />
    <div class="tw-flex-1 tw-overflow-hidden">
      <h2 class="tw-text-sm tw-m-0">
        {{ course.subject }} {{ course.catalogNumber }}
      </h2>
      <p class="tw-text-xs tw-m-0">
        {{ course.title }}
      </p>
    </div>
    <MoreMenu v-if="isEditable" class="tw-not-italic">
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
      v-if="isViewable"
      :show="isShowingEditModal"
      :initialPerson="person"
      :initialTerm="term"
      :initialCourse="course"
      :initialRole="props.enrollment.role"
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
  enrollment: T.Enrollment;
  isUnpublishedEditable: boolean;
  isUnpublishedViewable: boolean;
}>();

const planningStore = useRootCoursePlanningStore();
const term = computed(() =>
  planningStore.termsStore.getTerm(props.section.termId),
);

const isShowingEditModal = ref(false);

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

  const hasEnrollmentChanged =
    props.enrollment.emplid !== person.emplid || props.enrollment.role !== role;
  if (hasEnrollmentChanged) {
    const updatedEnrollment: T.Enrollment = {
      ...props.enrollment,
      emplid: person.emplid,
      role,
    };
    planningStore.enrollmentStore.updateEnrollment(updatedEnrollment);
  }
}

async function handleRemove() {
  if (!props.enrollment) {
    throw new Error("No enrollment found for section");
  }

  await planningStore.enrollmentStore.removeEnrollment(props.enrollment);

  const sectionEnrollments =
    planningStore.enrollmentStore.getEnrollmentsBySectionId(props.section.id);

  // if there are still enrollments in the section, don't remove it
  if (sectionEnrollments.length) return;

  await planningStore.removeSection(props.section);
}
</script>
<style scoped></style>
