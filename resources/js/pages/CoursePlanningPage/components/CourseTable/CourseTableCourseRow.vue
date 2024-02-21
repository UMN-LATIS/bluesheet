<template>
  <tr
    v-if="isCourseVisible"
    class="course-table-row"
    :class="{
      'course-table-row--is-draft-course': isCourseLocal,
    }"
  >
    <Td
      class="course-label-cell"
      :class="{
        '!tw-bg-neutral-100': isCourseLocal,
      }"
    >
      <div
        :class="{
          'tw-bg-yellow-100': isCourseHighlighted,
        }"
      >
        {{ course.subject }} {{ course.catalogNumber }}
        <span
          v-if="isCourseLocal"
          class="tw-italic tw-text-xs tw-text-neutral-400"
        >
          (Draft Course)
        </span>
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
        'term-data-column--current':
          coursePlanningStore.termsStore.isCurrentTerm(term.id),
        'term-data-column--fall': term.name.includes('Fall'),
      }"
    >
      <CourseTableCell :course="course" :term="term" />
    </Td>
  </tr>
</template>
<script setup lang="ts">
import { Td } from "@/components/Table";
import CourseTableCell from "./CourseTableCell.vue";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import * as T from "@/types";
import { computed } from "vue";

const props = defineProps<{
  course: T.Course;
}>();

const coursePlanningStore = useRootCoursePlanningStore();
const visibleTerms = computed(() => coursePlanningStore.visibleTerms);

const isCourseVisible = computed(() => {
  return coursePlanningStore.isCourseVisible(props.course);
});

const isCourseHighlighted = computed(() => {
  return (
    coursePlanningStore.filters.search.length &&
    coursePlanningStore.isCourseMatchingSearch(props.course)
  );
});

const isCourseLocal = computed(() => {
  return props.course.source === "local";
});
</script>
<style scoped>
.term-data-column {
  border-left: 1px solid #f3f3f3;
}

.term-data-column.term-data-column--current {
  background: rgb(255 248 220 / 68%);
  border-top: 1px solid #fde68a;
}

.term-data-column.term-data-column--current.term-data-column--fall {
  border-left: 2px solid #fde68a;
}

.term-data-column.term-data-column--fall {
  border-left: 2px solid #f3f3f3;
}
.course-table-row:hover .instructor-column {
  background-color: #f3f3f3;
}

.course-table-row.course-table-row--is-draft-course
  .term-data-column.term-data-column--current {
  background: hsla(58, 50%, 50%, 0.1);
}
</style>
<style>
.course-table-row.course-table-row--is-draft-course td {
  background: hsla(0, 0%, 0%, 0.05);
  border-top: 1px dashed #ccc;
  border-bottom: 1px dashed #ccc;
}

.course-table-row.course-table-row--is-draft-course .course-label-cell {
  border-left: 1px dashed #ccc;
}
</style>
