<template>
  <WideLayout>
    <Transition name="fade" mode="out-in">
      <div v-if="isLoadingComplete">
        <h1 class="tw-mb-4">
          {{ group?.group_title }} <br />
          <span class="tw-text-3xl">Scheduling Report</span>
        </h1>

        <CoursePlanningFilters :groupId="props.groupId" />

        <InstructorTable
          ref="tableRef"
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
import { computed, ref, watch } from "vue";
import InstructorTable from "./components/InstructorTable.vue";
import { useRootCoursePlanningStore } from "./stores/useRootCoursePlanningStore";
import CoursePlanningFilters from "./components/CoursePlanningFilters.vue";
import Spinner from "@/components/Spinner.vue";

const props = defineProps<{
  groupId: number;
}>();

const coursePlanningStore = useRootCoursePlanningStore();
const isLoadingComplete = ref(false);

onMounted(async () => {
  await coursePlanningStore.initGroup(props.groupId);
  console.log("group initialized");
  isLoadingComplete.value = true;
});

const group = computed(() => coursePlanningStore.getGroup(props.groupId));
const currentTerm = computed(() => coursePlanningStore.currentTerm);

const tableRef = ref<HTMLElement>();
watch(
  [isLoadingComplete, tableRef],
  () => {
    if (!isLoadingComplete.value || !tableRef.value) return;
    scrollToCurrentTerm();
  },
  { immediate: true },
);

function scrollToCurrentTerm() {
  if (!currentTerm.value) return;
  const currentTermEl = document.getElementById(`term-${currentTerm.value.id}`);
  if (!currentTermEl) {
    console.warn(
      `Could not find element for current term ${currentTerm.value.name}`,
    );
    return;
  }
  currentTermEl.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });
}
</script>
<style scoped></style>
