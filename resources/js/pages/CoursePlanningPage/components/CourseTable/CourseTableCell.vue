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
}
</script>
<style scoped></style>
