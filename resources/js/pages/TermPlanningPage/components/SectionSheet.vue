<template>
  <!--
    Absolute against the page wrapper, not fixed against the viewport, so
    the sheet stays below the app header instead of floating over it.
    Sticky inside that keeps the panel in view while the grid scrolls past
    underneath it, and the panel takes the viewport's full height so a
    short section still reads as a docked sheet rather than a floating
    card. Preflight is disabled project-wide (see DayColumn.vue), so the
    border needs `tw-border-0 tw-border-l tw-border-solid` to show only
    its left edge.
  -->
  <aside
    aria-label="Section details"
    class="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-z-30 tw-w-96 tw-max-w-full"
  >
    <div
      class="tw-pointer-events-auto tw-sticky tw-top-0 tw-h-screen tw-overflow-y-auto tw-border-0 tw-border-l tw-border-solid tw-border-neutral-200 tw-bg-white tw-p-4 tw-shadow-xl"
    >
      <div class="tw-mb-4 tw-flex tw-items-start tw-justify-between tw-gap-2">
        <div>
          <p class="tw-m-0 tw-text-xs tw-text-neutral-500">
            {{ section.title }}
          </p>
          <h2 class="tw-m-0 tw-text-base tw-font-bold">
            {{ section.subject }} {{ section.catalogNumber }} ·
            {{ section.section }}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close"
          class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-text-xl tw-leading-none tw-text-neutral-500"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <dl class="tw-m-0 tw-flex tw-flex-col tw-gap-3">
        <div>
          <dt :class="LABEL_CLASS">Component</dt>
          <dd class="tw-m-0">{{ section.component }}</dd>
        </div>

        <div>
          <dt :class="LABEL_CLASS">Credits</dt>
          <dd class="tw-m-0">{{ section.credits ?? "—" }}</dd>
        </div>

        <div>
          <dt :class="LABEL_CLASS">Meets</dt>
          <dd class="tw-m-0">
            <div v-for="(line, index) in meetingLines" :key="index">
              {{ line }}
            </div>
          </dd>
        </div>

        <div>
          <dt :class="LABEL_CLASS">Instructors</dt>
          <dd class="tw-m-0">
            <div v-if="section.instructors.length === 0">TBA</div>
            <div
              v-for="instructor in section.instructors"
              :key="instructor.emplid"
            >
              {{ instructor.name ?? "TBA" }}
              <span class="tw-text-neutral-500">{{ instructor.role }}</span>
            </div>
          </dd>
        </div>

        <div>
          <dt :class="LABEL_CLASS">Enrollment</dt>
          <dd class="tw-m-0">{{ enrollmentText }}</dd>
        </div>

        <div v-if="section.crosslist">
          <dt :class="LABEL_CLASS">Cross-listed as</dt>
          <dd class="tw-m-0">
            <div v-for="(line, index) in crosslistLines" :key="index">
              {{ line }}
            </div>
          </dd>
        </div>

        <div>
          <dt :class="LABEL_CLASS">Class number</dt>
          <dd class="tw-m-0">{{ section.classNumber }}</dd>
        </div>
      </dl>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatTimeRange, minutesFromClock } from "../helpers/timeScale";
import type { SisDay, SisSection } from "../types";

const props = defineProps<{
  section: SisSection;
}>();

const emit = defineEmits<{ close: [] }>();

/** Shared by every row's label, styled like a form field's. */
const LABEL_CLASS =
  "tw-m-0 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-neutral-500";

const DAY_LABELS: Record<SisDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const meetingLines = computed(() =>
  props.section.meetings.length === 0
    ? ["No set time"]
    : props.section.meetings.map((pattern) => {
        const days = pattern.days.map((day) => DAY_LABELS[day]).join(", ");
        const range = formatTimeRange(
          minutesFromClock(pattern.startTime),
          minutesFromClock(pattern.endTime),
        );
        return `${days} ${range}`;
      }),
);

const enrollmentText = computed(() => {
  const { enrollmentTotal, enrollmentCap, waitlistTotal } = props.section;
  const waitlisted = waitlistTotal > 0 ? ` · ${waitlistTotal} waitlisted` : "";
  return `${enrollmentTotal} of ${enrollmentCap}${waitlisted}`;
});

const crosslistLines = computed(
  () =>
    props.section.crosslist?.partners.map(
      (partner) =>
        `${partner.subject} ${partner.catalogNumber}-${partner.section}`,
    ) ?? [],
);
</script>
