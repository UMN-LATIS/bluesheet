<template>
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
          :modelValue="filters.startTermId ?? ''"
          label="Start Term"
          :showLabel="false"
          :options="termSelectOptions"
          @update:modelValue="setStartTermId(Number.parseInt($event))"
        />
        <SelectGroup
          :modelValue="filters.endTermId ?? ''"
          label="End Term"
          :showLabel="false"
          :options="termSelectOptions"
          @update:modelValue="setEndTermId(Number.parseInt($event))"
        />
      </div>
    </fieldset>

    <div class="tw-flex tw-gap-8 tw-mb-4 tw-flex-wrap">
      <fieldset v-show="academicApptCounts.length">
        <div class="tw-flex tw-items-baseline tw-mb-1">
          <legend
            class="tw-uppercase tw-text-xs tw-text-neutral-500 tw-tracking-wide tw-font-semibold"
          >
            Instructor Appointment
          </legend>
          <Button variant="tertiary" @click="toggleAllAcadAppts">
            Select All
          </Button>
        </div>
        <label
          v-for="[category, count] in academicApptCounts"
          :key="category"
          class="tw-flex tw-items-center tw-text-sm gap-1"
        >
          <input
            type="checkbox"
            :checked="!filters.excludedAcadAppts.has(category)"
            class="tw-form-checkbox tw-mr-2 tw-border tw-border-neutral-500 tw-rounded"
            @change="toggleAcadApptFilter(category)"
          />

          {{ category }}
          <span class="tw-text-neutral-400 tw-text-xs ml-1">({{ count }})</span>
        </label>
      </fieldset>

      <fieldset>
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
          <span class="tw-text-neutral-400 tw-text-xs ml-1">({{ count }})</span>
        </label>
      </fieldset>
      <fieldset>
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
          v-for="[courseLevel, count] in sortedCourseLevels"
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
          <span class="tw-text-neutral-400 tw-text-xs ml-1">({{ count }})</span>
        </label>
      </fieldset>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import SelectGroup from "@/components/SelectGroup.vue";
import Button from "@/components/Button.vue";
import { useRootCoursePlanningStore } from "../stores/useRootCoursePlanningStore";
import { storeToRefs } from "pinia";
import { Group } from "@/types";
import * as T from "../coursePlanningTypes";

const props = defineProps<{
  groupId: Group["id"];
}>();

const coursePlanningStore = useRootCoursePlanningStore();

const { filters, termSelectOptions } = storeToRefs(coursePlanningStore);
const { setStartTermId, setEndTermId, toggleAcadApptFilter } =
  coursePlanningStore;

const academicApptCounts = computed(() => {
  return coursePlanningStore.getAcadApptCountsForGroup(props.groupId);
});

const courseTypeCounts = computed(
  (): Record<T.Course["courseType"], number> => {
    return coursePlanningStore.getCourseTypeCountsForGroup(props.groupId);
  },
);
const sortedCourseTypes = computed(() => {
  return Object.entries(courseTypeCounts.value).sort((a, b) => {
    return a[0].localeCompare(b[0]);
  });
});

const courseLevelCounts = computed(
  (): Record<T.Course["courseLevel"], number> => {
    return coursePlanningStore.getCourseLevelCountsForGroup(props.groupId);
  },
);

const sortedCourseLevels = computed(() => {
  return Object.entries(courseLevelCounts.value).sort((a, b) => {
    return a[0].localeCompare(b[0]);
  });
});

function toggleAllAcadAppts() {
  const areAllExcluded = academicApptCounts.value.every(([acadAppt]) =>
    filters.value.excludedAcadAppts.has(acadAppt),
  );

  if (areAllExcluded) {
    coursePlanningStore.setExcludedAcadAppts([]);
    return;
  }

  const allApptTypes = academicApptCounts.value.map(([acadAppt]) => acadAppt);
  coursePlanningStore.setExcludedAcadAppts(allApptTypes);
}

function toggleAllCourseTypes() {
  const areAllExcluded = sortedCourseTypes.value.every(([courseType]) =>
    filters.value.excludedCourseTypes.has(courseType),
  );
  console.log(areAllExcluded);

  if (areAllExcluded) {
    return coursePlanningStore.setExcludedCourseTypes([]);
  }

  const allCourseTypes = sortedCourseTypes.value.map(
    ([courseType]) => courseType,
  );
  coursePlanningStore.setExcludedCourseTypes(allCourseTypes);
}

function toggleAllCourseLevels() {
  const areAllExcluded = sortedCourseLevels.value.every(([courseLevel]) =>
    filters.value.excludedCourseLevels.has(courseLevel),
  );

  if (areAllExcluded) {
    return coursePlanningStore.setExcludedCourseLevels([]);
  }

  const allCourseLevels = sortedCourseLevels.value.map(
    ([courseLevel]) => courseLevel,
  );
  coursePlanningStore.setExcludedCourseLevels(allCourseLevels);
}
</script>
<style scoped></style>
