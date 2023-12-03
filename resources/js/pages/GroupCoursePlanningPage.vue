<template>
  <WideLayout>
    <h1>Group Course Planning Page</h1>
  </WideLayout>
</template>
<script setup lang="ts">
import WideLayout from "@/layouts/WideLayout.vue";
import { onMounted } from "vue";
import * as api from "@/api";

const props = defineProps<{
  groupId: number;
}>();

onMounted(() => {
  const res = api.getGroupCourseHistory(props.groupId);
});
</script>
<style scoped></style>
