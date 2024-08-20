<template>
  <WideLayout>
    <Transition name="fade" mode="out-in">
      <div v-if="isLoadingComplete">
        <div
          class="tw-flex tw-justify-between tw-flex-wrap tw-gap-4 tw-items-baseline tw-mb-4"
        >
          <header>
            <h1>{{ group?.group_title }}</h1>
            <h2 class="tw-text-3xl">Faculty Leaves Planning Report</h2>
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
              v-if="canViewPlannedCourses"
              id="toggle-planning-mode"
              v-model="coursePlanningStore.filters.inPlanningMode"
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
          v-if="isShowingFilters"
          :groupId="props.groupId"
          class="tw-bg-neutral-100 tw-p-4 tw-rounded-md tw-my-4"
        />
        <div
          class="tw-flex tw-justify-between tw-flex-wrap tw-items-center gap-2 tw-mt-12"
        >
          <Tabs class="tw-mb-2" :tabs="tabs" @change="handleTabChange" />

          <div class="tw-flex tw-gap-2">
            <DownloadSpreadsheetButton
              :filename="spreadsheetDownloadFilename"
              :sheetData="[
                {
                  sheetName: 'Instructors',
                  data: () =>
                    getSpreadsheetFromWorker(
                      MESSAGE_TYPES.INSTRUCTOR_SPREADSHEET_REQUEST,
                    ),
                },
                {
                  sheetName: 'TAs',
                  data: () =>
                    getSpreadsheetFromWorker(
                      MESSAGE_TYPES.TA_SPREADSHEET_REQUEST,
                    ),
                },
                {
                  sheetName: 'Courses',
                  data: () =>
                    getSpreadsheetFromWorker(
                      MESSAGE_TYPES.COURSES_SPREADSHEET_REQUEST,
                    ),
                },
              ]"
            />

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
          v-if="showPersonTable"
          ref="personTableRef"
          :label="personTableLabel"
          :groupId="groupId"
        />

        <CourseTable
          v-if="showCourseTable"
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
import { useCoursePlanningStore } from "./stores/useCoursePlanningStore";
import { usePermissionsStore } from "@/stores/usePermissionsStore";
import CoursePlanningFilters from "./components/CoursePlanningFilters.vue";
import Spinner from "@/components/Spinner.vue";
import Tabs, { type Tab } from "@/components/Tabs.vue";
import CheckboxGroup from "@/components/CheckboxGroup.vue";
import { CourseTable } from "./components/CourseTable";
import { useDebouncedComputed } from "@/utils/useDebouncedComputed";
import DownloadSpreadsheetButton from "@/components/DownloadSpreadsheetButton.vue";
import { getSpreadsheetFromWorker } from "./workers/getSpreadsheetFromWorker";
import * as MESSAGE_TYPES from "./workers/messageTypes";
import qs from "qs";
import { omit } from "lodash-es";

const props = defineProps<{
  groupId: number;
}>();

const coursePlanningStore = useCoursePlanningStore();
const permissionsStore = usePermissionsStore();
const isLoadingComplete = ref(false);
const isShowingFilters = ref(false);

onMounted(async () => {
  await coursePlanningStore.initGroup(props.groupId);

  // parse query params and set filters
  const parsedQuery = qs.parse(window.location.search, {
    ignoreQueryPrefix: true,
  });

  // if there's something in the parsed query, show filters to user
  coursePlanningStore.setFiltersFromQueryString(parsedQuery);

  // if the set filters are different from the defaults, show filters
  // to the user
  if (!coursePlanningStore.hasDefaultFilters()) {
    isShowingFilters.value = true;
  }

  performance.mark("CoursePlanningPage:start");
  isLoadingComplete.value = true;
});

const canViewPlannedCourses = ref(false);
watch(
  () => props.groupId,
  async () => {
    canViewPlannedCourses.value =
      await permissionsStore.canViewAnyCoursesForGroup(props.groupId);
  },
  { immediate: true },
);

// keep url in sync with filters
watch(
  () => coursePlanningStore.filters,
  () => {
    // waith until load is complete to avoid clobbering
    // any initial filters set from query params
    if (!isLoadingComplete.value) return;

    const serializabledFilters = coursePlanningStore.getSerializableFilters();
    const filtersToPersist = omit(serializabledFilters, ["search"]);

    const normalizedFilters = qs.stringify(filtersToPersist, {
      // some names have `&` in them, so we need to encode them
      encode: true,
    });
    history.replaceState(null, "", `?${normalizedFilters}`);
    // router.replace({ query: normalizedFilters });
  },
  { deep: true },
);

const group = computed(() =>
  coursePlanningStore.groupStore.getGroup(props.groupId),
);

const currentTerm = computed(() => coursePlanningStore.termsStore.currentTerm);

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

const showPersonTable = useDebouncedComputed(
  () => activeTab.value === "instructors" || activeTab.value === "tas",
  [activeTab],
);

const showCourseTable = useDebouncedComputed(
  () => activeTab.value === "courses",
  [activeTab],
);

function handleTabChange(tab: Tab) {
  activeTab.value = tab.id as typeof activeTab.value;

  const tabRoleLookup = {
    instructors: ["PI"],
    tas: ["TA"],
    courses: ["PI", "TA"],
  };

  setTimeout(() => {
    coursePlanningStore.setIncludedEnrollmentRoles(tabRoleLookup[tab.id]);
  }, 0);
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

const spreadsheetDownloadFilename = computed(() => {
  const prettyDate = new Date().toISOString().split("T")[0];
  const groupName = group.value?.group_title
    ?.split(" ")
    .join("")
    .replace(/[^a-zA-Z0-9-]/g, "");
  return `leavePlanningReport_${groupName}_${prettyDate}.xlsx`;
});
</script>
<style scoped></style>
