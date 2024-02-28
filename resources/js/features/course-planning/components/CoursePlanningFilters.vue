<template>
  <section class="tw-flex tw-flex-col tw-gap-4">
    <h3
      class="tw-inline-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide"
    >
      Filter Results
    </h3>
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
            Employee Appointment
          </legend>
          <Button variant="tertiary" @click="toggleAllAcadAppts">
            Select All
          </Button>
        </div>
        <label
          v-for="[category, count] in coursePlanningStore.sortedAcadAppts"
          :key="category"
          class="tw-flex tw-items-center tw-text-sm gap-1"
        >
          <input
            type="checkbox"
            :checked="!filters.excludedAcadAppts.has(category)"
            class="tw-form-checkbox tw-mr-2 tw-border tw-border-neutral-500 tw-rounded"
            @change="
              filters.excludedAcadAppts.has(category)
                ? filters.excludedAcadAppts.delete(category)
                : filters.excludedAcadAppts.add(category)
            "
          />

          {{ category }}
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

const coursePlanningStore = useRootCoursePlanningStore();

const { filters, sortedCourseLevels, sortedCourseTypes } =
  storeToRefs(coursePlanningStore);
const {
  setStartTermId,
  setEndTermId,
  toggleAllAcadAppts,
  toggleAllCourseLevels,
  toggleAllCourseTypes,
} = coursePlanningStore;

const termSelectOptions = computed(
  () => coursePlanningStore.termsStore.termSelectOptions,
);
</script>
<style scoped></style>
