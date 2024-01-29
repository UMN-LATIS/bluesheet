<template>
  <div>
    <p>{{ person?.emplid }}</p>
    <p>{{ section?.dbId }}</p>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import * as T from "@/types";
import { useRootCoursePlanningStore } from "../../stores/useRootCoursePlanningStore";

const props = defineProps<{
  enrollment: T.Enrollment;
}>();

const coursePlanningStore = useRootCoursePlanningStore();

const person = computed((): T.Person | null =>
  coursePlanningStore.personStore.getPersonByEmplId(props.enrollment.emplid),
);

const section = computed((): T.CourseSection | null =>
  coursePlanningStore.courseSectionStore.getSection(props.enrollment.sectionId),
);
</script>
<style scoped></style>
