<template>
  <div>
    <DraggableCard
      v-if="isUnpublishedViewable"
      :isDraggable="isUnpublishedEditable"
      :isEditable="isUnpublishedEditable"
      :class="{
        '!tw-bg-neutral-100': isDraftCourse,
      }"
      @click:remove="handleRemove"
      @click:edit="isShowingEditModal = true"
    >
      <h2 class="tw-text-sm tw-m-0">
        {{ person?.givenName }} {{ person?.surName ?? "Unknown" }}
      </h2>

      <p class="tw-text-xs tw-m-0">
        {{ prettyEnrollmentRole }}
      </p>
    </DraggableCard>
    <EditDraftSectionModal
      :show="isShowingEditModal"
      :initialPerson="person"
      :initialTerm="term"
      :initialCourse="course"
      :initialRole="enrollment.role"
      @save="handleEditSave"
      @close="isShowingEditModal = false"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import * as T from "@/types";
import { useCoursePlanningStore } from "../../stores/useCoursePlanningStore";
import DraggableCard from "@/components/DraggableCard.vue";
import EditDraftSectionModal from "../EditDraftSectionModal.vue";

const props = defineProps<{
  enrollment: T.Enrollment;
}>();

const planningStore = useCoursePlanningStore();

const person = computed((): T.Person | null =>
  planningStore.personStore.getPersonByEmplId(props.enrollment.emplid),
);

const prettyEnrollmentRole = computed(
  () => T.enrollmentRoleMap[props.enrollment.role],
);

const section = computed((): T.CourseSection | null =>
  planningStore.courseSectionStore.getSection(props.enrollment.sectionId),
);

const term = computed(() =>
  section.value ? planningStore.termsStore.getTerm(section.value.termId) : null,
);
const course = computed(() =>
  section.value
    ? planningStore.courseStore.getCourse(section.value.courseId)
    : null,
);

const isDraftCourse = computed(() => {
  return course.value?.source === "local";
});

const isUnpublishedViewable = computed((): boolean => {
  return (
    !!section.value &&
    planningStore.filters.inPlanningMode &&
    planningStore.termsStore.isTermPlannable(section.value.termId) &&
    planningStore.currentUserCan.viewAnyPlannedCoursesForGroup
  );
});

const isUnpublishedEditable = computed((): boolean => {
  return (
    isUnpublishedViewable.value &&
    planningStore.currentUserCan.editPlannedCoursesForGroup
  );
});

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
  if (!section.value) {
    throw new Error("No section found for enrollment");
  }

  const hasSectionChanged =
    course.id !== section.value.courseId || term.id !== section.value.termId;

  if (hasSectionChanged) {
    const updatedSection: T.CourseSection = {
      ...section.value,
      courseId: course.id,
      termId: term.id,
      isPublished: false,
    };

    planningStore.courseSectionStore.updateSection(updatedSection);
  }

  if (!props.enrollment) {
    throw new Error("No enrollment found for section");
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

function handleRemove() {
  if (!section.value) {
    throw new Error("No section found for enrollment");
  }

  planningStore.courseSectionStore.removeSection(section.value);
  planningStore.enrollmentStore.removeEnrollment(props.enrollment);
}
</script>
<style scoped></style>
