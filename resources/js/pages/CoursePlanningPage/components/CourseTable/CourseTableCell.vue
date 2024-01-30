<template>
  <div>
    <EnrollmentInPublishedSection
      v-for="enrollment in enrollmentsInPublishedSection"
      :key="enrollment.id"
      :enrollment="enrollment"
    />

    <DragDrop
      v-if="arePlannedSectionsViewable"
      :id="`courseid.${course.id}_termid.${term.id}`"
      group="course-table"
      :list="enrollmentsInUnpublishedSection"
      :disabled="!arePlannedSectionsEditable"
      class="tw-flex tw-flex-col tw-gap-1 tw-pb-12 tw-flex-1 tw-h-full group"
      :meta="{
        course,
        term,
      }"
      @drop="handleEnrollmentChange"
    >
      <template #item="{ element: enrollment }">
        <EnrollmentInUnpublishedSection :enrollment="enrollment" />
      </template>
    </DragDrop>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import * as T from "@/types";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import EnrollmentInPublishedSection from "./EnrollmentInPublishedSection.vue";
import EnrollmentInUnpublishedSection from "./EnrollmentInUnpublishedSection.vue";
import { partition } from "lodash";
import { DragDrop } from "@/components/DragDrop";
import { $can } from "@/utils";
import { DropEvent } from "@/types";

const props = defineProps<{
  course: T.Course;
  term: T.Term;
}>();

const coursePlanningStore = useRootCoursePlanningStore();

const enrollmentsInCourseByTermLookup = computed(
  (): Record<T.Term["id"], T.Enrollment[]> =>
    coursePlanningStore.getEnrollmentsInCourseByTerm(props.course.id),
);

const courseEnrollmentsThisTerm = computed(() => {
  return enrollmentsInCourseByTermLookup.value[props.term.id] ?? [];
});

const partitionedEnrollments = computed(() => {
  return partition(courseEnrollmentsThisTerm.value, (enrollment) => {
    const section = coursePlanningStore.courseSectionStore.getSection(
      enrollment.sectionId,
    );
    return section?.isPublished;
  });
});

const enrollmentsInPublishedSection = computed(() => {
  return partitionedEnrollments.value[0];
});

const enrollmentsInUnpublishedSection = computed(() => {
  return partitionedEnrollments.value[1];
});

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

interface CourseTableDragDropMeta extends T.DragDropMeta {
  course: T.Course;
  term: T.Term;
}

type CourseTableDropEvent = DropEvent<T.Enrollment, CourseTableDragDropMeta>;

async function handleEnrollmentChange(event: CourseTableDropEvent) {
  const targetCourse = event.targetListMeta.course;
  const targetTerm = event.targetListMeta.term;
  const enrollment = event.item;
  const originalSectionId = event.item.sectionId;

  // get the previous section and enrollments
  const prevSection =
    coursePlanningStore.courseSectionStore.getSectionWithEnrollments(
      originalSectionId,
    );

  if (!prevSection) {
    throw new Error(
      `Could not find section with id ${originalSectionId} in course ${props.course.id}`,
    );
  }

  // if there's only one enrollment in the section
  // we can just move the section to the new course/term
  if (prevSection.enrollments.length === 1) {
    await coursePlanningStore.courseSectionStore.updateSection({
      ...prevSection,
      courseId: targetCourse.id,
      termId: targetTerm.id,
    });

    return;
  }

  // otherwise, to avoid moving other enrollments (e.g. TA's)
  // at the same time - which might not be intended -
  // let's create a new section to hold this enrollment
  const newSection = await coursePlanningStore.courseSectionStore.createSection(
    {
      course: targetCourse,
      term: targetTerm,
    },
  );

  // and move this enrollment to the new section
  await coursePlanningStore.enrollmentStore.updateEnrollment({
    ...enrollment,
    sectionId: newSection.id,
  });
}
</script>
<style scoped></style>
