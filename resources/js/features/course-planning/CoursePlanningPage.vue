<template>
  <WideLayout>
    <Transition name="fade" mode="out-in">
      <div v-if="isLoadingComplete">
        <div
          class="tw-flex tw-justify-between tw-flex-wrap tw-gap-4 tw-items-baseline tw-mb-4"
        >
          <header>
            <h1>{{ group?.group_title }}</h1>
            <h2 class="tw-text-3xl">Scheduling Report</h2>
          </header>
          <aside
            class="tw-max-w-xs tw-bg-neutral-100 tw-p-4 tw-rounded-md tw-w-full"
          >
            <h2
              class="tw-inline-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-mb-4"
            >
              Settings
            </h2>
            <CheckboxGroup
              id="toggle-planning-mode"
              v-model="coursePlanningStore.isInPlanningMode"
              label="Planning Mode"
              description="Add/remove tentative courses."
            />
            <CheckboxGroup
              id="toggle-filters"
              :modelValue="isShowingFilters"
              label="Filter Results"
              description="By date, course, or instructor."
              @update:modelValue="handleToggleFiltersClick"
            />
          </aside>
        </div>

        <CoursePlanningFilters
          v-show="isShowingFilters"
          :groupId="props.groupId"
          class="tw-bg-neutral-100 tw-p-4 tw-rounded-md tw-my-4"
        />
        <div
          class="tw-flex tw-justify-between tw-flex-wrap tw-items-center gap-2 tw-mt-12"
        >
          <Tabs class="tw-mb-2" :tabs="tabs" @change="handleTabChange" />

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

        <PersonTable
          v-if="['instructors', 'tas'].includes(activeTab)"
          ref="personTableRef"
          :label="personTableLabel"
          :groupId="groupId"
        />

        <CourseTable
          v-if="activeTab === 'courses'"
          label="Courses"
          :groupId="groupId"
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
import { PersonTable } from "./components/PersonTable";
import { useRootCoursePlanningStore } from "./stores/useRootCoursePlanningStore";
import CoursePlanningFilters from "./components/CoursePlanningFilters.vue";
import Spinner from "@/components/Spinner.vue";
import Tabs, { type Tab } from "@/components/Tabs.vue";
import Toggle from "@/components/Toggle.vue";
import Button from "@/components/Button.vue";
import { FilterIcon } from "@/icons";
import CheckboxGroup from "@/components/CheckboxGroup.vue";
import { CourseTable } from "./components/CourseTable";

const props = defineProps<{
  groupId: number;
}>();

const coursePlanningStore = useRootCoursePlanningStore();
const isLoadingComplete = ref(false);
const isShowingFilters = ref(false);

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

const personTableLabel = computed(() => {
  if (activeTab.value === "instructors") return "Instructors";
  if (activeTab.value === "tas") return "Teaching Assistants";
  return "People";
});

function handleTabChange(tab: Tab) {
  activeTab.value = tab.id as typeof activeTab.value;

  // update the planning store's included roles
  if (activeTab.value === "instructors") {
    coursePlanningStore.setIncludedEnrollmentRoles(["PI"]);
    return;
  }
  if (activeTab.value === "tas") {
    coursePlanningStore.setIncludedEnrollmentRoles(["TA"]);
    return;
  }
  coursePlanningStore.setIncludedEnrollmentRoles(["PI", "TA"]);
}

const personTableRef = ref<HTMLElement>();
watch(
  [isLoadingComplete, personTableRef],
  () => {
    if (!isLoadingComplete.value || !personTableRef.value) return;
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

function handleToggleFiltersClick(isChecked: boolean) {
  isShowingFilters.value = isChecked;

  // reset all filters when filters are hidden
  if (!isChecked) {
    coursePlanningStore.resetFilters();
  }
}

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
