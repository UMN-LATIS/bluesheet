<template>
  <div>
    <EnrollmentInPublishedSection
      v-for="enrollment in enrollmentsInPublishedSection"
      :key="enrollment.id"
      :enrollment="enrollment"
    />

    <EnrollmentInUnpublishedSection
      v-for="enrollment in enrollmentsInUnpublishedSection"
      :key="enrollment.id"
      :enrollment="enrollment"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import * as T from "@/types";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import { ChevronRightIcon } from "@/icons";
import EnrollmentInPublishedSection from "./EnrollmentInPublishedSection.vue";
import EnrollmentInUnpublishedSection from "./EnrollmentInUnpublishedSection.vue";
import { partition } from "lodash";

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
</script>
<style scoped></style>
