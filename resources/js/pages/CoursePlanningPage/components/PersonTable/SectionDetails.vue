<template>
  <div
    v-if="course && enrollment && isViewable"
    :class="{
      'tw-bg-yellow-100': isSectionHighlighted,
    }"
  >
    <UnpublishedSectionDetails
      v-if="isUnpublished"
      :section="section"
      :course="course"
      :person="person"
      :enrollment="enrollment"
      :isEditable="isEditable"
      :isViewable="isViewable"
    />

    <PublishedSectionDetails v-else :section="section" :course="course" />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import * as T from "@/types";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import PublishedSectionDetails from "./PublishedSectionDetails.vue";
import UnpublishedSectionDetails from "./UnpublishedSectionDetails.vue";

const props = defineProps<{
  section: T.CourseSection;
  person: T.Person;
  isEditable: boolean;
}>();

const planningStore = useRootCoursePlanningStore();

const course = computed(() =>
  planningStore.courseStore.getCourse(props.section.courseId),
);

const isUnpublished = computed(() => !props.section.isPublished);

const isSectionHighlighted = computed(
  () =>
    planningStore.filters.search.length &&
    planningStore.isSectionMatchingSearch(props.section),
);

const enrollment = computed(() =>
  planningStore.enrollmentStore.getEnrollmentForPersonInSection(
    props.person,
    props.section,
  ),
);

const isViewable = computed(() => {
  return (
    planningStore.isSectionVisible(props.section) &&
    enrollment.value &&
    // show if published
    (props.section.isPublished ||
      // or if we're in planning mode and it's a draft section
      (!props.section.isPublished && planningStore.isInPlanningMode)) &&
    // and we're not filtering out this enrollment's role
    planningStore.filters.includedEnrollmentRoles.includes(
      enrollment.value.role,
    )
  );
});
</script>
<style scoped></style>
