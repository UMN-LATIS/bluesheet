<template>
  <WideLayout class="scheduling-report-page">
    <h1 class="tw-mb-4">
      {{ group?.group_title }} <br />
      <span class="tw-text-3xl">Scheduling Report</span>
    </h1>
    <section class="tw-flex tw-flex-col tw-gap-4 tw-mb-4">
      <h2 class="sr-only">Report Filters</h2>

      <fieldset>
        <legend
          class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide tw-font-semibold"
        >
          Date Range
        </legend>
        <div class="tw-flex tw-gap-2">
          <SelectGroup
            :modelValue="groupCourseHistoryStore.startTermId ?? ''"
            label="Start Term"
            :showLabel="false"
            :options="allTermOptions"
            @update:modelValue="
              groupCourseHistoryStore.setStartTermId(Number.parseInt($event))
            "
          />
          <SelectGroup
            :modelValue="groupCourseHistoryStore.endTermId ?? ''"
            label="End Term"
            :showLabel="false"
            :options="allTermOptions"
            @update:modelValue="
              groupCourseHistoryStore.setEndTermId(Number.parseInt($event))
            "
          />
        </div>
      </fieldset>

      <div class="tw-flex tw-gap-8 tw-mb-4 tw-flex-wrap">
        <fieldset v-show="instructorAppointmentTypesMap.size">
          <div class="tw-flex tw-items-baseline tw-mb-1">
            <legend
              class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide tw-font-semibold"
            >
              Instructor Appointment
            </legend>
            <Button variant="tertiary" @click="toggleAllInstructorAppointments">
              Select All
            </Button>
          </div>
          <label
            v-for="[category, count] in sortedAppointmentTypeFilters"
            :key="category"
            class="tw-flex tw-items-center tw-text-sm gap-1"
          >
            <input
              type="checkbox"
              :checked="!filters.excludedInstAppointments.has(category)"
              class="tw-form-checkbox tw-mr-2 tw-border tw-border-neutral-500 tw-rounded"
              @change="
                filters.excludedInstAppointments.has(category)
                  ? filters.excludedInstAppointments.delete(category)
                  : filters.excludedInstAppointments.add(category)
              "
            />

            {{ category }}
            <span class="tw-text-neutral-400 tw-text-xs ml-1"
              >({{ count }})</span
            >
          </label>
        </fieldset>

        <fieldset v-show="courseTypesMap.size">
          <div class="tw-flex tw-items-baseline tw-mb-1">
            <legend
              class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide tw-font-semibold"
            >
              Course Types
            </legend>
            <Button variant="tertiary" @click="toggleAllCourseTypes"
              >Select All</Button
            >
          </div>
          <label
            v-for="[courseType, count] in sortedCourseTypes"
            :key="courseType"
            class="tw-flex tw-items-center tw-text-sm gap-1"
          >
            <input
              type="checkbox"
              :checked="!filters.excludedCourseTypes.has(courseType)"
              class="tw-form-checkbox tw-mr-2 tw-border tw-border-neutral-500 tw-rounded"
              @change="
                filters.excludedCourseTypes.has(courseType)
                  ? filters.excludedCourseTypes.delete(courseType)
                  : filters.excludedCourseTypes.add(courseType)
              "
            />

            {{ courseType }}
            <span class="tw-text-neutral-400 tw-text-xs ml-1"
              >({{ count }})</span
            >
          </label>
        </fieldset>
        <fieldset v-show="courseLevelsMap.size">
          <div class="tw-flex tw-items-baseline tw-mb-1">
            <legend
              class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide tw-font-semibold"
            >
              Course Levels
            </legend>
            <Button variant="tertiary" @click="toggleAllCourseLevels"
              >Select All</Button
            >
          </div>
          <label
            v-for="[courseLevel, count] in courseLevelsMap.entries()"
            :key="courseLevel"
            class="tw-flex tw-items-center tw-text-sm gap-1"
          >
            <input
              type="checkbox"
              :checked="!filters.excludedCourseLevels.has(courseLevel)"
              class="tw-form-checkbox tw-mr-2 tw-border tw-border-neutral-500 tw-rounded"
              @change="
                filters.excludedCourseLevels.has(courseLevel)
                  ? filters.excludedCourseLevels.delete(courseLevel)
                  : filters.excludedCourseLevels.add(courseLevel)
              "
            />

            {{ courseLevel }}
            <span class="tw-text-neutral-400 tw-text-xs ml-1"
              >({{ count }})</span
            >
          </label>
        </fieldset>
      </div>
    </section>

    <div class="tw-flex tw-justify-between tw-flex-wrap tw-items-center gap-2">
      <Tabs
        class="tw-mb-2"
        :tabs="[
          {
            id: 'instructors',
            name: 'Instructors',
            current: activeTab === 'instructors',
          },
          {
            id: 'tas',
            name: 'Teaching Assistants',
            current: activeTab === 'tas',
          },
          { id: 'courses', name: 'Courses', current: activeTab === 'courses' },
        ]"
        @change="handleTabChange"
      />

      <div class="tw-flex tw-items-center tw-gap-4">
        <Toggle v-model="groupCourseHistoryStore.isInPlanningMode">
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

    <div class="tw-relative tw-min-h-[8em] tw-overflow-hidden">
      <!-- <Transition name="fade">
        <div
          v-if="!isLoadingComplete"
          class="tw-flex tw-justify-center tw-items-start tw-bg-white/5 tw-gap-4 tw-absolute tw-inset-0 tw-z-10 tw-backdrop-blur-sm tw-p-16"
        >
          <Spinner class="tw-text-neutral-900 tw-w-6 tw-h-6" />
          Building Report...
        </div>
      </Transition> -->
      <InstructorTable
        v-show="activeTab === 'instructors'"
        ref="tableRef"
        :label="`Instructors`"
        :terms="groupCourseHistoryStore.termsInRange"
        :instructors="filteredPrimaryInstructors"
        :currentTerm="currentTerm"
        :getLeavesForInstructorPerTerm="getLeavesForInstructorPerTerm"
        :getCoursesForInstructorPerTerm="getFilteredCoursesForInstructorPerTerm"
        :search="filters.search"
        :termLoadStateMap="termLoadStateMap"
      />
      <InstructorTable
        v-show="activeTab === 'tas'"
        ref="tableRef"
        :label="`Teaching Assistants`"
        :terms="groupCourseHistoryStore.termsInRange"
        :instructors="filteredTeachingAssistants"
        :currentTerm="currentTerm"
        :getLeavesForInstructorPerTerm="getLeavesForInstructorPerTerm"
        :getCoursesForInstructorPerTerm="getFilteredCoursesForInstructorPerTerm"
        :search="filters.search"
        :termLoadStateMap="termLoadStateMap"
      />
      <CourseTable
        v-show="activeTab === 'courses'"
        :terms="groupCourseHistoryStore.termsInRange"
        :courses="filteredCourses"
        :currentTerm="currentTerm"
        :leavesPerTerm="groupCourseHistoryStore.leavesPerTerm"
        :getInstructorsForCoursePerTerm="getFilteredInstructorsForCoursePerTerm"
        :search="filters.search"
        :termLoadStateMap="termLoadStateMap"
      />
    </div>
  </WideLayout>
</template>

<script setup lang="ts">
import WideLayout from "@/layouts/WideLayout.vue";
import InstructorTable from "./InstructorTable.vue";
import Button from "@/components/Button.vue";
import { reactive, ref, watch, computed } from "vue";
import debounce from "lodash-es/debounce";
import {
  Course,
  CourseShortCode,
  Group,
  Instructor,
  TimelessCourse,
} from "@/types";
import { doesCourseNumberMatchSearchTerm } from "./doesCourseMatchSearchTerm";
import CourseTable from "./CourseTable.vue";
import { useGroupCourseHistoryStore } from "@/stores/useGroupCourseHistoryStore";
import { storeToRefs } from "pinia";
import * as api from "@/api";
import Tabs, { type Tab } from "@/components/Tabs.vue";
import SelectGroup from "@/components/SelectGroup.vue";
import Toggle from "@/components/Toggle.vue";

const props = defineProps<{
  groupId: number;
}>();

const groupCourseHistoryStore = useGroupCourseHistoryStore(props.groupId);
const group = ref<null | Group>(null);
const isInPlanningMode = ref(false);

watch(
  () => props.groupId,
  async (newGroupId) => {
    group.value = await api.fetchGroup(newGroupId);
  },
  { immediate: true },
);

const {
  allTerms,
  currentTerm,
  isLoadingComplete,
  instructorAppointmentTypesMap,
  allInstructors,
  allCourses: allTimelessCourses,
  courseLevelsMap,
  courseTypesMap,
  termLoadStateMap,
} = storeToRefs(groupCourseHistoryStore);

const {
  getLeavesForInstructorPerTerm,
  getInstructorsForCoursePerTerm,
  getCoursesForInstructorPerTerm,
} = groupCourseHistoryStore;

const filters = reactive({
  startTermId: "",
  endTermId: "",
  search: "",
  excludedCourseTypes: new Set<string>(),
  excludedCourseLevels: new Set<string>(),
  excludedInstAppointments: new Set<string>(),
});

const activeTab = ref<"instructors" | "tas" | "courses">("instructors");
const searchInputRaw = ref("");
const debouncedSearch = debounce(() => {
  filters.search = searchInputRaw.value;
}, 500);
watch(searchInputRaw, debouncedSearch);

const tableRef = ref<HTMLElement>();
watch(
  isLoadingComplete,
  () => {
    scrollToCurrentTerm();
  },
  { immediate: true },
);

function scrollToCurrentTerm() {
  if (!currentTerm.value) return;
  const currentTermEl = document.getElementById(`term-${currentTerm.value.id}`);
  if (!currentTermEl) return;
  currentTermEl.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });
}

const filteredInstructors = computed(() =>
  allInstructors.value.filter(
    (instructor) =>
      isIncludedInstructorAppointment(instructor) &&
      hasInstructorTaughtCourseMatchingFilters(instructor) &&
      (filters.search === "" ||
        doesInstructorNameMatchSearchTerm(instructor, filters.search) ||
        hasInstructorTaughtCourseMatchingSearchTerm(instructor)),
  ),
);

const filteredPrimaryInstructors = computed(() =>
  filteredInstructors.value.filter(
    (instructor) => instructor.instructorRole === "PI",
  ),
);

const filteredTeachingAssistants = computed(() =>
  filteredInstructors.value.filter(
    (instructor) => instructor.instructorRole === "TA",
  ),
);

const filteredCourses = computed(() => {
  return allTimelessCourses.value.filter((course) => {
    return (
      doesCourseMatchFilter(course) &&
      hasSomeInstructorMatchingFiltersTaughtCourse(course) &&
      (filters.search === "" ||
        doesCourseNumberMatchSearchTerm(course, filters.search) ||
        hasSomeInstructorMatchingSearchTermTaughtCourse(course))
    );
  });
});

function hasSomeInstructorMatchingSearchTermTaughtCourse(course) {
  return (
    getInstructorsForCoursePerTerm(course.shortCode)
      .flat()
      // then check if any course matches our search term
      .some((instructorWithCourse) => {
        return doesInstructorNameMatchSearchTerm(
          instructorWithCourse,
          filters.search,
        );
      })
  );
}
function hasSomeInstructorMatchingFiltersTaughtCourse(course) {
  return (
    getInstructorsForCoursePerTerm(course.shortCode)
      .flat()
      // then check if any course matches our filters
      .some((instructorWithCourse) => {
        return isIncludedInstructorAppointment(instructorWithCourse);
      })
  );
}

function doesInstructorNameMatchSearchTerm(
  instructor: Instructor,
  searchTerm: string,
) {
  return (
    instructor.surName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.givenName.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

function getFilteredCoursesForInstructorPerTerm(instructorId: number) {
  const courses = getCoursesForInstructorPerTerm(instructorId);
  return courses.map((termCourses) => {
    return termCourses.filter(doesCourseMatchFilter);
  });
}

/**
 * Returns a list of instructors for a course, filtered by the current filters.
 */
function getFilteredInstructorsForCoursePerTerm(
  courseShortCode: CourseShortCode,
) {
  const instructors = getInstructorsForCoursePerTerm(courseShortCode);
  return instructors.map((termInstructors) => {
    return termInstructors.filter(isIncludedInstructorAppointment);
  });
}

function sortEntriesByKey(
  a: [key: string, value: unknown],
  b: [key: string, value: unknown],
): number {
  return a[0].localeCompare(b[0]);
}

const sortedAppointmentTypeFilters = computed(() => {
  return [...instructorAppointmentTypesMap.value.entries()].sort(
    sortEntriesByKey,
  );
});

const sortedCourseTypes = computed(() => {
  return [...courseTypesMap.value.entries()].sort(sortEntriesByKey);
});

function isIncludedInstructorAppointment(instructor: Instructor) {
  return !filters.excludedInstAppointments.has(instructor.academicAppointment);
}

function doesCourseMatchFilter(course: Course | TimelessCourse) {
  return (
    // course type is not excluded (i.e. included)
    !filters.excludedCourseTypes.has(course.courseType) &&
    // course level is not excluded (i.e. included)
    !filters.excludedCourseLevels.has(course.courseLevel)
  );
}

function hasInstructorTaughtCourseMatchingSearchTerm(instructor: Instructor) {
  // get a flat list of all the courses this instructor has taught
  return (
    getCoursesForInstructorPerTerm(instructor.id)
      .flat()
      // then check if any course matches our search term
      .some((course) => doesCourseNumberMatchSearchTerm(course, filters.search))
  );
}

function hasInstructorTaughtCourseMatchingFilters(instructor: Instructor) {
  // get a flat list of all the courses this instructor has taught
  return (
    getCoursesForInstructorPerTerm(instructor.id)
      .flat()
      // then check if any course matches our filters
      .some(doesCourseMatchFilter)
  );
}

function toggleAllInstructorAppointments() {
  const areAllSelected = filters.excludedInstAppointments.size === 0;
  if (areAllSelected) {
    // deselect all (i.e. add all keys to the excluded set)
    filters.excludedInstAppointments = new Set(
      instructorAppointmentTypesMap.value.keys(),
    );
    return;
  }

  // otherwise select all (i.e. clear the set)
  filters.excludedInstAppointments.clear();
}

function toggleAllCourseTypes() {
  const areAllSelected = filters.excludedCourseTypes.size === 0;
  if (areAllSelected) {
    // deselect all (i.e. add all keys to the excluded set)
    filters.excludedCourseTypes = new Set(courseTypesMap.value.keys());
    return;
  }

  // otherwise select all (i.e. clear the set)
  filters.excludedCourseTypes.clear();
}

function toggleAllCourseLevels() {
  const areAllSelected = filters.excludedCourseLevels.size === 0;
  if (areAllSelected) {
    // deselect all (i.e. add all keys to the excluded set)
    filters.excludedCourseLevels = new Set(courseLevelsMap.value.keys());
    return;
  }

  // otherwise select all (i.e. clear the set)
  filters.excludedCourseLevels.clear();
}

function handleTabChange(tab: Tab) {
  activeTab.value = tab.id as typeof activeTab.value;
}

const allTermOptions = computed(() => {
  return allTerms.value.map((term) => ({
    text: term.name,
    value: term.id,
  }));
});
</script>
<style scoped lang="scss">
.details-list {
  max-width: 480px;
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 0 1rem;
  align-items: baseline;
  margin-top: 1rem;
  margin-bottom: 1rem;

  & dt {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    color: #999;
    white-space: nowrap;
  }
}
</style>
<style lang="scss">
.scheduling-report-page__post-it {
  max-width: 90em;
  padding: 1rem;
  width: 100%;
  margin: auto;
}
.scheduling-report-page__post-it .outer-container {
  max-width: 100% !important;
}

.term-header-column.term-header-column--is-fall-term {
  border-left: 2px solid #eee;
}

.tab-button.tab-button--active {
  background: #3490dc;
  color: #fff;
}

// fix width of cells to prevent them from embiggening
// when a collapseable item is expanded
.scheduling-report-page td,
.scheduling-report-page th {
  min-width: 16rem;
  max-width: 16rem;
}
</style>
