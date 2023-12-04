<template>
  <WideLayout>
    <h1>Group Course Planning Page</h1>
  </WideLayout>
</template>
<script setup lang="ts">
import WideLayout from "@/layouts/WideLayout.vue";
import { onMounted } from "vue";
import * as coursePlanningApi from "./coursePlanningApi";
import * as api from "@/api";

const props = defineProps<{
  groupId: number;
}>();

onMounted(async () => {
  const [terms, group, sections, enrollments, leaves, people] =
    await Promise.all([
      api.fetchTerms(),
      api.fetchGroup(props.groupId),
      coursePlanningApi.fetchCourseSections(props.groupId),
      coursePlanningApi.fetchEnrollments(props.groupId, ["PI", "TA"]),
      coursePlanningApi.fetchLeaves(props.groupId),
      coursePlanningApi.fetchPeople(props.groupId),
    ]);

  console.log({
    terms,
    group,
    sections,
    enrollments,
    leaves,
    people,
  });
});
</script>
<style scoped></style>
