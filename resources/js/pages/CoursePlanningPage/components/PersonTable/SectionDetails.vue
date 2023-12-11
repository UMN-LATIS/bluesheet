<template>
  <div
    v-if="course"
    v-show="isSectionVisible"
    :class="{
      'tw-bg-yellow-100': isSectionHighlighted,
    }"
  >
    <UnpublishedSectionDetails
      v-if="isUnpublished"
      :section="section"
      :course="course"
      :person="person"
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
}>();

const planningStore = useRootCoursePlanningStore();

const course = computed(() => planningStore.getCourse(props.section.courseId));

const isSectionVisible = computed(() =>
  planningStore.isSectionVisible(props.section),
);

const isUnpublished = computed(() => !props.section.isPublished);

const isSectionHighlighted = computed(
  () =>
    planningStore.filters.search.length &&
    planningStore.isSectionMatchingSearch(props.section),
);
</script>
<style scoped></style>
