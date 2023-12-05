<template>
  <WideLayout>
    <Transition name="fade" mode="out-in">
      <div v-if="isReady">
        <h1 class="tw-mb-4">
          {{ group?.group_title }} <br />
          <span class="tw-text-3xl">Scheduling Report</span>
        </h1>

        <CoursePlanningFilters :groupId="props.groupId" />

        <InstructorTable
          label="Instructors"
          :groupId="props.groupId"
          :roles="['PI']"
        />
      </div>
      <div
        v-else
        class="tw-flex tw-min-h-[25vh] tw-rounded-md tw-items-center tw-justify-center tw-gap-2"
      >
        <Spinner class="tw-w-6 tw-h-6 tw-text-neutral-200" />
        <span class="tw-text-neutral-400">Loading...</span>
      </div>
    </Transition>
  </WideLayout>
</template>
<script setup lang="ts">
import WideLayout from "@/layouts/WideLayout.vue";
import { onMounted } from "vue";
import { computed, ref } from "vue";
import InstructorTable from "./components/InstructorTable.vue";
import { useRootCoursePlanningStore } from "./stores/useRootCoursePlanningStore";
import CoursePlanningFilters from "./components/CoursePlanningFilters.vue";
import Spinner from "@/components/Spinner.vue";

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
