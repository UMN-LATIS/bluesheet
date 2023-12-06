<template>
  <WideLayout>
    <Transition name="fade" mode="out-in">
      <div v-if="isLoadingComplete">
        <h1 class="tw-mb-4">
          {{ group?.group_title }} <br />
          <span class="tw-text-3xl">Scheduling Report</span>
        </h1>

        <CoursePlanningFilters :groupId="props.groupId" />
        <div
          class="tw-flex tw-justify-between tw-flex-wrap tw-items-center gap-2"
        >
          <Tabs class="tw-mb-2" :tabs="tabs" @change="handleTabChange" />

          <div class="tw-flex tw-items-center tw-gap-4">
            <Toggle v-model="coursePlanningStore.isInPlanningMode">
              Planning Mode
            </Toggle>

            <label
              class="tw-border tw-border-umn-neutral-200 tw-max-w-xs tw-w-full tw-rounded-md !tw-block !tw-mb-0"
            >
              <span class="sr-only"
                >Filter by instructor name or course number</span
              >
              <input
                v-model="searchInputRaw"
                placeholder="Search table"
                :showLabel="false"
                class="tw-w-full tw-border-none tw-rounded-none tw-px-4 tw-py-2 tw-bg-transparent tw-text-sm"
              />
            </label>
          </div>
        </div>

        <PersonTable
          ref="tableRef"
          label="Instructors"
          :groupId="props.groupId"
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
import { computed, ref, watch, onMounted } from "vue";
import { debounce } from "lodash";
import PersonTable from "./components/PersonTable.vue";
import { useRootCoursePlanningStore } from "./stores/useRootCoursePlanningStore";
import CoursePlanningFilters from "./components/CoursePlanningFilters.vue";
import Spinner from "@/components/Spinner.vue";
import Tabs, { type Tab } from "@/components/Tabs.vue";
import Toggle from "@/components/Toggle.vue";

const props = defineProps<{
  groupId: number;
}>();

const coursePlanningStore = useRootCoursePlanningStore();
const isLoadingComplete = ref(false);

onMounted(async () => {
  await coursePlanningStore.initGroup(props.groupId);
  isLoadingComplete.value = true;
});

const group = computed(() => coursePlanningStore.getGroup(props.groupId));

const currentTerm = computed(() => coursePlanningStore.currentTerm);

const activeTab = ref<"instructors" | "tas" | "courses">("instructors");

const tabs = computed(() => [
  {
    id: "instructors",
    name: "Instructors",
    current: activeTab.value === "instructors",
  },
  {
    id: "tas",
    name: "Teaching Assistants",
    current: activeTab.value === "tas",
  },
  { id: "courses", name: "Courses", current: activeTab.value === "courses" },
]);

function handleTabChange(tab: Tab) {
  activeTab.value = tab.id as typeof activeTab.value;
}

const tableRef = ref<HTMLElement>();
watch(
  [isLoadingComplete, tableRef],
  () => {
    if (!isLoadingComplete.value || !tableRef.value) return;
    scrollToCurrentTerm();
  },
  { immediate: true },
);

const searchInputRaw = ref("");
watch(
  searchInputRaw,
  () => coursePlanningStore.setSearchFilter(searchInputRaw.value),
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
