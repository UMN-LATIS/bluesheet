<template>
  <WideLayout>
    <h1>Group Course Planning Page</h1>
  </WideLayout>
</template>
<script setup lang="ts">
import WideLayout from "@/layouts/WideLayout.vue";
import { onMounted } from "vue";
import * as coursePlanningApi from "./coursePlanningApi";

const props = defineProps<{
  groupId: number;
}>();

onMounted(async () => {
  const res = await coursePlanningApi.getGroup(props.groupId);
  console.log(res);
});
</script>
<style scoped></style>
