<template>
  <tr v-if="isCourseVisible">
    <Td class="course-column">
      <div
        :class="{
          'tw-bg-yellow-100': isCourseHighlighted,
        }"
      >
        {{ course.subject }} {{ course.catalogNumber }}
      </div>

      <div class="tw-text-xs tw-text-neutral-500">
        <div>{{ course.title }}</div>
        <div>{{ course.courseType }} • {{ course.courseLevel }}</div>
      </div>
    </Td>
    <Td
      v-for="term in visibleTerms"
      :key="term.id"
      class="term-data-column"
      :class="{
        'term-data-column--current': currentTerm?.id === term.id,
        'term-data-column--fall': term.name.includes('Fall'),
      }"
    >
      <EnrollmentDetails
        v-for="enrollment in getEnrollmentsForTerm(term)"
        :key="enrollment.id"
        :enrollment="enrollment"
      />
    </Td>
  </tr>
</template>
<script setup lang="ts">
import { Td } from "@/components/Table";
import { Term } from "@/types";
import EnrollmentDetails from "./EnrollmentDetails.vue";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import { storeToRefs } from "pinia";
import * as T from "@/types";
import { computed } from "vue";

const coursePlanningStore = useRootCoursePlanningStore();
const { visibleTerms, currentTerm } = storeToRefs(coursePlanningStore);

const props = defineProps<{
  course: T.Course;
}>();

const enrollmentsByTermLookup = computed(
  (): Record<Term["id"], T.Enrollment[]> =>
    coursePlanningStore.getEnrollmentsInCourseByTerm(props.course.id),
);

function getEnrollmentsForTerm(term: Term): T.Enrollment[] {
  return enrollmentsByTermLookup.value[term.id] ?? [];
}

const isCourseVisible = computed(() => {
  return coursePlanningStore.isCourseVisible(props.course);
});

const isCourseHighlighted = computed(() => {
  return (
    coursePlanningStore.filters.search.length &&
    coursePlanningStore.isCourseMatchingSearch(props.course)
  );
});
</script>
<style scoped>
.term-data-column.term-data-column--current {
  background: #fffcf0;
  border-top: 1px solid #fde68a;
}

.term-data-column.term-data-column--current.term-data-column--fall {
  border-left: 2px solid #fde68a;
}

.term-data-column.term-data-column--fall {
  border-left: 2px solid #f3f3f3;
}
</style>
