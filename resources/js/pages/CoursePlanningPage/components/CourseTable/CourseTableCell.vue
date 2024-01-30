<template>
  <div>
    <EnrollmentInPublishedSection
      v-for="enrollment in enrollmentsInPublishedSection"
      :key="enrollment.id"
      :enrollment="enrollment"
    />

    <DragDrop
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

// function getPreviousCourseFromEvent(
//   event: DropEvent<T.Enrollment>,
// ): T.Course | null {
//   // use the source list id to get the person id
//   const courseInfo = (event.sourceListId as string).split("-")[0];
//   const courseId = courseInfo.split(".")[1] as T.Course["id"];

//   // then use the person id to get the person
//   return coursePlanningStore.courseStore.getCourse(courseId);
// }

interface CourseTableDragDropMeta extends T.DragDropMeta {
  course: T.Course;
  term: T.Term;
}

type CourseTableDropEvent = DropEvent<T.Enrollment, CourseTableDragDropMeta>;

async function handleEnrollmentChange(event: CourseTableDropEvent) {
  console.log("handleEnrollmentChange", event);

  // since sections can have multiple enrollments
  // (e.g. assigned TA's)
  // and the user may not intend to move ALL of them
  // to the new course/term, it's probably best
  // to just create a new section to hold this enrollment
  // leaving the old section intact
  // then remove the old section if it's empty

  const targetCourse = event.targetListMeta.course;
  const targetTerm = event.targetListMeta.term;
  const enrollment = event.item;
  const originalSectionId = event.item.sectionId;

  // create a new section for the new course and term
  const newSection = await coursePlanningStore.courseSectionStore.createSection(
    {
      course: targetCourse,
      term: targetTerm,
    },
  );

  // move the enrollment to the new section
  await coursePlanningStore.enrollmentStore.updateEnrollment({
    ...enrollment,
    sectionId: newSection.id,
  });

  // now get the previous section and enrollments
  const prevSection =
    coursePlanningStore.courseSectionStore.getSectionWithEnrollments(
      originalSectionId,
    );

  if (!prevSection) {
    throw new Error(
      `Could not find section with id ${originalSectionId} in course ${props.course.id}`,
    );
  }

  // if there are no more enrollments in the previous section
  // we can delete it
  if (prevSection.enrollments.length === 0) {
    await coursePlanningStore.courseSectionStore.removeSection(prevSection);
  }
}
</script>
<style scoped></style>
