<template>
  <Table :stickyHeader="true" :stickyFirstColumn="true">
    <THead>
      <ReportTableHeaderRow :label="`Courses`" />
    </THead>
    <TBody>
      <CourseTableLeavesRow :groupId="groupId" />
      <CourseTableCourseRow
        v-for="course in courses"
        :key="course.id"
        :course="course"
      />
    </TBody>
  </Table>
</template>
<script setup lang="ts">
import { Table, TBody, THead } from "@/components/Table";
import CourseTableCourseRow from "./CourseTableCourseRow.vue";
import CourseTableLeavesRow from "./CourseTableLeavesRow.vue";
import ReportTableHeaderRow from "../ReportTableHeaderRow.vue";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";
import { Group } from "@/types";
import { computed } from "vue";

defineProps<{
  label: string;
  groupId: Group["id"];
}>();

const coursePlanningStore = useRootCoursePlanningStore();
const courses = computed(() => coursePlanningStore.courseStore.allCourses);
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
