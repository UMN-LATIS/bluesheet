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
        v-if="matches.length === 0 && !nameable"
        class="tw-m-0 tw-px-2.5 tw-py-3 tw-text-[12.5px] tw-text-on-surface-variant"
      >
        No course matches. Type a subject and number to name a new one.
      </p>

      <template v-if="nameable">
        <FieldDivider v-if="matches.length > 0" />
        <div
          v-if="naming"
          class="tw-flex tw-flex-col tw-gap-2 tw-px-2.5 tw-py-2"
        >
          <p class="tw-m-0 tw-text-[13px] tw-font-bold">
            New course {{ naming.subject }} {{ naming.catalogNumber }}
          </p>
          <input
            v-model="title"
            type="text"
            aria-label="Course title"
            placeholder="Title"
            class="field-control tw-w-full"
          />
          <input
            v-model="credits"
            type="number"
            min="0"
            aria-label="Credits"
            placeholder="Credits"
            class="field-control tw-w-24"
          />
          <p v-if="nameError" class="tw-m-0 tw-text-xs tw-text-red-700">
            {{ nameError }}
          </p>
          <div class="tw-flex tw-items-center tw-gap-3">
            <button
              type="button"
              class="tw-min-h-11 tw-rounded-full tw-border-none tw-bg-primary tw-px-5 tw-text-[13px] tw-font-bold tw-text-on-primary disabled:tw-cursor-default disabled:tw-bg-surface-container-high disabled:tw-text-on-surface-variant"
              :class="{ 'tw-cursor-pointer': title.trim() !== '' }"
              :disabled="title.trim() === '' || createCourse.isPending.value"
              @click="addCourse"
            >
              Add course
            </button>
            <button
              type="button"
              class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-semibold tw-text-on-surface-variant hover:tw-underline"
              @click="naming = null"
            >
              Back
            </button>
          </div>
        </div>
        <button
          v-else
          type="button"
          class="tw-flex tw-w-full tw-min-h-11 tw-cursor-pointer tw-items-center tw-rounded-[7px] tw-border-none tw-bg-transparent tw-px-2.5 tw-text-left tw-text-[13px] tw-font-semibold tw-text-primary hover:tw-bg-surface"
          @click="startNaming"
        >
          Name a new course: {{ nameable.subject }}
          {{ nameable.catalogNumber }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId } from "vue";
import { onClickOutside } from "@vueuse/core";
import FieldDivider from "./FieldDivider.vue";
import FieldLabel from "./FieldLabel.vue";
import UnofficialTag from "./UnofficialTag.vue";
import {
  courseCodeOf,
  parseCourseCode,
  searchCourses,
} from "../helpers/courseCode";
import { useTermPlanCoursesQuery } from "../queries/useTermPlanCoursesQuery";
import { useTermPlanMutations } from "../queries/useTermPlanMutations";
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
const { createCourse } = useTermPlanMutations(groupId, termCode);

const search = ref("");
const isOpen = ref(false);
const naming = ref<ReturnType<typeof parseCourseCode>>(null);
const title = ref("");
const credits = ref("");
const nameError = ref("");

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

/**
 * The course the typed text names, or null when the department already has
 * that code. Narrow this to `local_courses` alone and a code the SIS carries
 * becomes nameable, at which point `CourseUnion` hides the saved row behind
 * the SIS one and nobody sees it again.
 */
const nameable = computed(() => {
  const parts = parseCourseCode(search.value);
  if (!parts) return null;

  const code = courseCodeOf(parts);

  return courses.value.some((course) => course.courseCode === code)
    ? null
    : parts;
});

function open() {
  isOpen.value = true;
  search.value = "";
  nextTick(() => inputRef.value?.focus());
}

function close() {
  isOpen.value = false;
  naming.value = null;
  nameError.value = "";
}

function choose(course: PlannableCourse) {
  emit("update:modelValue", course);
  close();
}

function startNaming() {
  naming.value = nameable.value;
  title.value = "";
  credits.value = "";
  nameError.value = "";
}

async function addCourse() {
  if (!naming.value) return;

  nameError.value = "";

  try {
    const course = await createCourse.mutateAsync({
      subject: naming.value.subject,
      catalogNumber: naming.value.catalogNumber,
      title: title.value.trim(),
      credits: credits.value.trim() === "" ? null : Number(credits.value),
    });

    choose(course);
  } catch {
    nameError.value = "That course could not be added. It may already exist.";
  }
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
