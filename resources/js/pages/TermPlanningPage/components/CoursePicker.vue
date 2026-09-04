<template>
  <div ref="containerRef" class="tw-relative" @keydown.escape="close">
    <FieldLabel :for="inputId">Course</FieldLabel>

    <div
      v-if="chosen && !isOpen"
      class="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-[10px] tw-border tw-border-solid tw-border-outline-variant tw-px-3"
    >
      <span class="tw-min-w-0 tw-flex-1 tw-truncate tw-text-sm">
        <span class="tw-font-semibold">
          {{ chosen.subject }} {{ chosen.catalogNumber }}
        </span>
        · {{ chosen.title }}
      </span>
      <UnofficialTag v-if="chosen.source === 'local'" />
      <button
        type="button"
        class="tw-flex-none tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[12.5px] tw-font-semibold tw-text-primary hover:tw-underline"
        @click="open"
      >
        Change
      </button>
    </div>

    <input
      v-else
      :id="inputId"
      ref="inputRef"
      v-model="search"
      type="text"
      role="combobox"
      :aria-expanded="isOpen"
      aria-autocomplete="list"
      placeholder="Subject, number, or title"
      class="field-control tw-w-full"
      @focus="isOpen = true"
    />

    <div
      v-if="isOpen"
      role="listbox"
      aria-label="Courses"
      class="tw-absolute tw-inset-x-0 tw-z-[60] tw-mt-1 tw-max-h-72 tw-overflow-y-auto tw-rounded-[10px] tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-p-1.5 tw-shadow-[0_10px_28px_rgba(38,38,38,0.18)]"
    >
      <button
        v-for="course in matches"
        :key="course.id"
        type="button"
        role="option"
        :aria-selected="course.courseCode === modelValue"
        class="tw-flex tw-w-full tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-[7px] tw-border-none tw-bg-transparent tw-px-2.5 tw-text-left tw-text-[13px] hover:tw-bg-surface"
        @click="choose(course)"
      >
        <span class="tw-flex-none tw-font-semibold">
          {{ course.subject }} {{ course.catalogNumber }}
        </span>
        <span
          class="tw-min-w-0 tw-flex-1 tw-truncate tw-text-on-surface-variant"
        >
          {{ course.title }}
        </span>
        <UnofficialTag v-if="course.source === 'local'" />
      </button>

      <p
        v-if="matches.length === 0"
        class="tw-m-0 tw-px-2.5 tw-py-3 tw-text-[12.5px] tw-text-on-surface-variant"
      >
        No course matches what you typed.
      </p>

      <FieldDivider v-if="matches.length > 0" />
      <button
        type="button"
        class="tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-items-center tw-rounded-[7px] tw-border-none tw-bg-transparent tw-px-2.5 tw-text-left tw-text-[13px] tw-font-semibold tw-text-primary hover:tw-bg-surface"
        @click="isNamingCourse = true"
      >
        Create new course…
      </button>
    </div>

    <NewCourseModal
      :show="isNamingCourse"
      :groupId="groupId"
      :termCode="termCode"
      @close="isNamingCourse = false"
      @created="courseNamed"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId } from "vue";
import { onClickOutside } from "@vueuse/core";
import FieldDivider from "./FieldDivider.vue";
import FieldLabel from "./FieldLabel.vue";
import NewCourseModal from "./NewCourseModal.vue";
import UnofficialTag from "./UnofficialTag.vue";
import { searchCourses } from "../helpers/courseSearch";
import { useTermPlanCoursesQuery } from "../queries/useTermPlanCoursesQuery";
import type { PlannableCourse } from "../types";

const props = defineProps<{
  groupId: number;
  termCode: number | null;
  /** A `courseCode`, e.g. "ANTH-1001"; null until one is chosen. */
  modelValue: string | null;
}>();

const emit = defineEmits<{ "update:modelValue": [PlannableCourse] }>();

const inputId = useId();

const groupId = computed(() => props.groupId);
const termCode = computed(() => props.termCode);

const coursesQuery = useTermPlanCoursesQuery(groupId);

const search = ref("");
const isOpen = ref(false);
const isNamingCourse = ref(false);

const containerRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
onClickOutside(containerRef, () => close());

const courses = computed(() => coursesQuery.data.value ?? []);

const chosen = computed(
  () =>
    courses.value.find((course) => course.courseCode === props.modelValue) ??
    null,
);

const matches = computed(() => searchCourses(courses.value, search.value));

function open() {
  isOpen.value = true;
  search.value = "";
  nextTick(() => inputRef.value?.focus());
}

function close() {
  isOpen.value = false;
}

function choose(course: PlannableCourse) {
  emit("update:modelValue", course);
  close();
}

function courseNamed(course: PlannableCourse) {
  isNamingCourse.value = false;
  choose(course);
}
</script>

<style scoped>
/* Matches SectionSheet's controls; see the note on `.field-control` there. */
.field-control {
  min-height: 44px;
  border: 1px solid var(--outline-variant);
  border-radius: 10px;
  background-color: var(--surface-bright);
  padding-inline: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--on-surface);
}

.field-control:focus {
  border-color: var(--primary);
  outline: none;
}
</style>
