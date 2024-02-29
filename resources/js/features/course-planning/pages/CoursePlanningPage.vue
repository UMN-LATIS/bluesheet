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
              v-if="canViewPlanCourses"
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
                  data: () => getInstructorSpreadsheetFromWorker(),
                },
                // {
                //   sheetName: 'TAs',
                //   data: () => getTASpreadsheetFromWorker(),
                // },
                // {
                //   sheetName: 'Courses',
                //   data: () => getCourseSpreadsheetFromWorker(),
                // },
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
import * as T from "@/types";
import WideLayout from "@/layouts/WideLayout.vue";
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import { PersonTable } from "../components/PersonTable";
import { useCoursePlanningStore } from "../stores/useCoursePlanningStore";
import CoursePlanningFilters from "../components/CoursePlanningFilters.vue";
import Spinner from "@/components/Spinner.vue";
import Tabs, { type Tab } from "@/components/Tabs.vue";
import CheckboxGroup from "@/components/CheckboxGroup.vue";
import { CourseTable } from "../components/CourseTable";
import { useDebouncedComputed } from "@/utils/useDebouncedComputed";
import { $can } from "@/utils";
import DownloadSpreadsheetButton from "@/components/DownloadSpreadsheetButton.vue";
import {
  type WorkerMessage,
  MESSAGE_TYPES,
} from "../workers/coursePlanningWorker";
import coursePlanningWorkerURL from "../workers/coursePlanningWorker?worker&url";
import { useWebWorkerFn } from "@vueuse/core";
import { getPersonSpreadsheetRecords } from "../helpers/getPersonSpreadsheetRecords";
import { deserializeCoursePlanningFilters } from "../helpers/serializedCoursePlanningFilters";
import { cloneDeep } from "lodash";

const props = defineProps<{
  groupId: number;
}>();

const coursePlanningStore = useCoursePlanningStore();
const isLoadingComplete = ref(false);
const isShowingFilters = ref(false);

onMounted(async () => {
  await coursePlanningStore.initGroup(props.groupId);
  performance.mark("CoursePlanningPage:start");
  isLoadingComplete.value = true;
});

const canViewPlanCourses = computed(() => $can("view planned courses"));
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

interface SerializableFilters {
  startTermId: number | null;
  endTermId: number | null;
  excludedCourseLevels: string[];
  excludedCourseTypes: string[];
  excludedAcadAppts: string[];
  includedEnrollmentRoles: T.EnrollmentRole[];
  search: string;
  inPlanningMode: boolean;
}

function serializeFilters(
  filters: T.CoursePlanningFilters,
): SerializableFilters {
  return {
    startTermId: filters.startTermId,
    endTermId: filters.endTermId,
    excludedCourseLevels: Array.from(filters.excludedCourseLevels),
    excludedCourseTypes: Array.from(filters.excludedCourseTypes),
    excludedAcadAppts: Array.from(filters.excludedAcadAppts),
    includedEnrollmentRoles: Array.from(filters.includedEnrollmentRoles),
    search: filters.search,
    inPlanningMode: filters.inPlanningMode,
  };
}

// const getInstructorSpreadsheet = ({
//   lookups,
//   serializedFilters,
// }: {
//   lookups: T.CoursePlanningLookups;
//   serializedFilters: T.SerializedCoursePlanningFilters;
// }) => {
//   const filters = deserializeCoursePlanningFilters(serializedFilters);
//   return getPersonSpreadsheetRecords({
//     lookups,
//     filters: {
//       ...filters,
//       includedEnrollmentRoles: new Set(["PI"]),
//     },
//   });
// };

// const { workerFn } = useWebWorkerFn(getInstructorSpreadsheet);

const js = `import ${JSON.stringify(
  new URL(coursePlanningWorkerURL, import.meta.url),
)}`;
const blob = new Blob([js], { type: "application/javascript" });
function createWorkaroundWorker({ name }: { name?: string } = {}) {
  const objURL = URL.createObjectURL(blob);
  const worker = new Worker(objURL, { type: "module", name });
  worker.addEventListener("error", (e) => {
    URL.revokeObjectURL(objURL);
  });
  return worker;
}

// function handleWorkerResponse(event: MessageEvent<WorkerMessage>) {
//   const { payload, error, type } = event.data;
//   if (type === MESSAGE_TYPES.INSTRUCTOR_TABLE_FAILURE) {
//     console.error(error);
//   }

//   if (type === MESSAGE_TYPES.INSTRUCTOR_TABLE_SUCCESS) {
//     console.log(payload);
//   }
// }

function getInstructorSpreadsheetFromWorker(): Promise<
  T.PersonSpreadsheetRowRecord[]
> {
  return new Promise((resolve, reject) => {
    const lookups = cloneDeep(coursePlanningStore.getCoursePlanningLookups());
    const filters = coursePlanningStore.filters;
    const serializedFilters = serializeFilters(filters);
    const worker = createWorkaroundWorker();

    // TODO: cleanup listeners
    worker.addEventListener(
      "message",
      (event: MessageEvent<WorkerMessage<T.PersonSpreadsheetRowRecord[]>>) => {
        const { payload, error, type } = event.data;
        if (type === MESSAGE_TYPES.INSTRUCTOR_TABLE_FAILURE) {
          console.error(error);
          worker.terminate();
          return reject(error);
        }

        if (type === MESSAGE_TYPES.INSTRUCTOR_TABLE_SUCCESS) {
          console.log({ payload });
          worker.terminate();
          return resolve(payload ?? []);
        }
      },
    );

    worker.postMessage({
      type: MESSAGE_TYPES.INSTRUCTOR_TABLE_REQUEST,
      payload: {
        lookups,
        serializedFilters,
      },
    });
  });
}
</script>
<style scoped></style>
