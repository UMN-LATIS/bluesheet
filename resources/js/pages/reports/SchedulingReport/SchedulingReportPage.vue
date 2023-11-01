<template>
  <WideLayout>
    <h1 class="tw-mb-4">
      {{ group?.group_title }} <br />
      <span class="tw-text-3xl">Scheduling Report</span>
    </h1>
    <section class="tw-flex tw-flex-col tw-gap-4 tw-mb-4">
      <h2 class="sr-only">Report Filters</h2>

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

    <div class="tw-relative tw-min-h-[8em]">
      <InstructorTable
        :terms="terms"
        :instructors="filteredInstructors"
        :currentTerm="currentTerm"
        :coursesByInstructorTermMap="coursesByInstructorTermMap"
        :getLeavesForInstructorPerTerm="getLeavesForInstructorPerTerm"
        :getCoursesForInstructorPerTerm="getCoursesForInstructorPerTerm"
      />
    </div>
  </WideLayout>
</template>

<script setup lang="ts">
import WideLayout from "@/layouts/WideLayout.vue";
import { useGroup } from "@/composables/useGroup";
import { useGroupCourseHistory } from "@/composables/useGroupCourseHistory";
import InstructorTable from "./InstructorTable.vue";
// import SelectGroup from "@/components/SelectGroup.vue";
import Button from "@/components/Button.vue";
import { reactive, ref, watch, computed } from "vue";
import debounce from "lodash-es/debounce";
import { Instructor } from "@/types";

const props = defineProps<{
  groupId: number;
}>();

const group = useGroup(props.groupId);
const {
  terms,
  currentTerm,
  allInstructors,
  coursesByInstructorTermMap,
  courseLevelsMap,
  courseTypesMap,
  instructorAppointmentTypesMap,
  getLeavesForInstructorPerTerm,
  getCoursesForInstructorPerTerm,
} = useGroupCourseHistory(props.groupId);

const filters = reactive({
  // startTermId: "",
  // endTermId: "",
  search: "",
  excludedCourseTypes: new Set<string>(),
  excludedCourseLevels: new Set<string>(),
  excludedInstAppointments: new Set<string>(),
});

const searchInputRaw = ref("");
const debouncedSearch = debounce(() => {
  filters.search = searchInputRaw.value;
}, 500);
watch(searchInputRaw, debouncedSearch);

const filteredInstructors = computed(() => {
  return allInstructors.value.filter((instructor) => {
    return [
      isIncludedInstructorAppointment,
      hasTaughtCourseMatchingFilters,
      isSearchEmptyOrMatchesInstructor,
    ].every((filter) => filter(instructor));
  });
});

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

function hasTaughtCourseMatchingFilters(instructor: Instructor) {
  // get a flat list of all the courses this instructor has taught
  return (
    getCoursesForInstructorPerTerm(instructor.id)
      .flat()
      // then check if any course matches our filters
      .some((course) => {
        return (
          // course type is not excluded (i.e. included)
          !filters.excludedCourseTypes.has(course.courseType) &&
          // course level is not excluded (i.e. included)
          !filters.excludedCourseLevels.has(course.courseLevel)
        );
      })
  );
}

function isSearchEmptyOrMatchesInstructor(instructor: Instructor) {
  return (
    filters.search === "" ||
    instructor.displayName.toLowerCase().includes(filters.search.toLowerCase())
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
</style>
