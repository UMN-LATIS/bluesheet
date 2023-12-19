<template>
  <div
    v-if="course && enrollment"
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
      :isUnpublishedEditable="isUnpublishedEditable"
      :isUnpublishedViewable="isUnpublishedViewable"
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
  isUnpublishedEditable: boolean;
  isUnpublishedViewable: boolean;
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
</script>
<style scoped></style>
