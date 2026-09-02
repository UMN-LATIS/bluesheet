<template>
  <!--
    Docked beside the grid as a column of its own, not floated over it, so
    the grid gives up width and scrolls sideways rather than losing its last
    days under the sheet. The page sizes this element; the sheet only fills
    it and scrolls inside when a section runs long.
  -->
  <aside
    aria-label="Section details"
    class="tw-min-h-0 tw-overflow-y-auto tw-bg-white tw-p-4"
  >
    <div>
      <!--
        Opened from a list (an hour of the heatmap), the sheet is one level
        down, so its way out is back up to that list rather than closing.
      -->
      <button
        v-if="returnTo"
        type="button"
        class="tw-mb-2 tw-flex tw-cursor-pointer tw-items-center tw-gap-1 tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-bs-blue hover:tw-underline"
        @click="emit('back')"
      >
        <i class="fas fa-chevron-left tw-text-[0.6rem]" aria-hidden="true" />
        {{ returnTo }}
      </button>

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
          v-if="!returnTo"
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
  /** Names the list this sheet was opened from, e.g. "Tue · 2 – 3p", if any. */
  returnTo?: string | null;
}>();

const emit = defineEmits<{ close: []; back: [] }>();

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
