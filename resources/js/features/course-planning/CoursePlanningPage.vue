<template>
  <WideLayout>
    <h1 class="tw-mb-4">
      {{ group?.group_title }} <br />
      <span class="tw-text-3xl">Scheduling Report</span>
    </h1>

    <InstructorTable
      v-if="isReady"
      label="Instructors"
      :groupId="props.groupId"
      :roles="['PI']"
    />
  </WideLayout>
</template>
<script setup lang="ts">
import WideLayout from "@/layouts/WideLayout.vue";
import { onMounted } from "vue";
import { computed, ref } from "vue";
import InstructorTable from "./components/InstructorTable.vue";
import { useRootCoursePlanningStore } from "./stores/useRootCoursePlanningStore";

const props = defineProps<{
  groupId: number;
}>();

const coursePlanningStore = useRootCoursePlanningStore();
const isReady = ref(false);

onMounted(async () => {
  await coursePlanningStore.initGroup(props.groupId);
  console.log("group initialized");
  isReady.value = true;
});

const group = computed(() => coursePlanningStore.getGroup(props.groupId));
</script>
<style scoped></style>
