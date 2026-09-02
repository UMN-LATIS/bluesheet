<!--
  The section as the term left it: every field of the sheet, read as its
  value. Read-only is a subtraction rather than a graying-out, so a field
  becomes plain text under the same label, in the same order — a scheduler
  reading a closed term learns the sheet they will use on an open one. What
  would have written is gone rather than dimmed: no remove ×, no Add, and
  nothing blue, since blue is what says "you can act on this".
-->
<template>
  <div
    class="scrollbar-always-visible tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-3 tw-overflow-y-auto tw-px-[18px] tw-pb-4 tw-pt-3.5"
  >
    <div>
      <span :class="LABEL_CLASS">Section</span>
      <span :class="VALUE_CLASS">{{ section.section }}</span>
    </div>

    <div>
      <span :class="LABEL_CLASS">Meets</span>
      <p
        v-if="section.meetings.length === 0"
        class="tw-m-0 tw-text-[15px] tw-font-semibold"
      >
        No set time
      </p>
      <div
        v-for="(pattern, patternIndex) in section.meetings"
        :key="patternIndex"
        class="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2.5 tw-gap-y-1"
      >
        <span :class="VALUE_CLASS">{{ daysMetSpelled(pattern.days) }}</span>
        <span class="tw-text-[15px]">{{ timeOf(pattern) }}</span>
        <span
          class="tw-text-[11.5px] tw-font-semibold tw-text-on-surface-variant"
        >
          {{ durationOf(pattern) }} min
        </span>
      </div>
    </div>

    <div class="tw-h-px tw-bg-surface-container" />

    <div>
      <span :class="LABEL_CLASS">Taught by</span>
      <div class="tw-flex tw-flex-col tw-gap-2">
        <PersonRecord
          v-for="instructor in instructorsOfRecord(section.instructors)"
          :key="instructor.emplid"
          :instructor="instructor"
          role="Instructor of record"
        />
        <p
          v-if="section.instructors.length === 0"
          class="tw-m-0 tw-text-[13px] tw-text-on-surface-variant"
        >
          TBA
        </p>
      </div>
    </div>

    <div class="tw-h-px tw-bg-surface-container" />

    <div>
      <span :class="LABEL_CLASS">Enrollment</span>
      <div class="tw-flex tw-items-baseline tw-gap-2.5">
        <span :class="VALUE_CLASS">
          {{ section.enrollmentTotal }} / {{ section.enrollmentCap }}
        </span>
        <span class="tw-text-[13px] tw-text-on-surface-variant">
          enrolled of cap
        </span>
      </div>
    </div>

    <div class="tw-h-px tw-bg-surface-container" />

    <div class="tw-flex tw-flex-col tw-gap-1.5">
      <Disclosure
        label="Component & delivery"
        :summary="`${section.component} · ${labelOfDelivery(section.delivery)}`"
      >
        <div class="tw-flex tw-gap-5">
          <div class="tw-min-w-0 tw-flex-1">
            <span :class="SUB_LABEL_CLASS">Component</span>
            <span class="tw-text-[13.5px]">
              {{ section.component }} —
              {{ labelOfComponent(section.component) }}
            </span>
          </div>
          <div class="tw-min-w-0 tw-flex-1">
            <span :class="SUB_LABEL_CLASS">Delivery</span>
            <span class="tw-text-[13.5px]">
              {{ labelOfDelivery(section.delivery) }}
            </span>
          </div>
        </div>
      </Disclosure>

      <div class="tw-h-px tw-bg-surface-container" />

      <Disclosure
        label="Cross-listings"
        :summary="partners.length === 0 ? 'None' : String(partners.length)"
      >
        <p
          v-if="partners.length === 0"
          class="tw-m-0 tw-text-[12.5px] tw-text-on-surface-variant"
        >
          This section is not listed under another number.
        </p>
        <div v-else class="tw-flex tw-flex-col tw-gap-1.5">
          <div
            v-for="partner in partners"
            :key="`${partner.subject}${partner.catalogNumber}${partner.section}`"
            class="tw-rounded-lg tw-bg-surface tw-px-3 tw-py-2 tw-text-[13px]"
          >
            {{ partner.subject }} {{ partner.catalogNumber }} ·
            {{ partner.section }}
          </div>
        </div>
      </Disclosure>

      <div class="tw-h-px tw-bg-surface-container" />

      <Disclosure
        label="Teaching assistants"
        :summary="String(assistants.length)"
      >
        <div v-if="assistants.length > 0" class="tw-flex tw-flex-col tw-gap-2">
          <PersonRecord
            v-for="instructor in assistants"
            :key="instructor.emplid"
            :instructor="instructor"
            :role="instructor.role"
          />
        </div>
        <p v-else class="tw-m-0 tw-text-[12.5px] tw-text-on-surface-variant">
          Nobody else is listed on this section.
        </p>
      </Disclosure>

      <div class="tw-h-px tw-bg-surface-container" />

      <Disclosure label="Notes" :summary="notesSummary">
        <p
          class="tw-m-0 tw-whitespace-pre-line tw-text-[12.5px]"
          :class="{ 'tw-text-on-surface-variant': section.notes.trim() === '' }"
        >
          {{
            section.notes.trim() === ""
              ? "Nobody left a note on this section."
              : section.notes
          }}
        </p>
      </Disclosure>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Disclosure from "./Disclosure.vue";
import PersonRecord from "./PersonRecord.vue";
import { labelOfComponent } from "../constants/meetingTypeColors";
import { labelOfDelivery } from "../constants/delivery";
import { daysMetSpelled } from "../helpers/scheduleDays";
import { assistantsOf, instructorsOfRecord } from "../helpers/sectionPeople";
import {
  formatClock,
  formatTime,
  minutesFromClock,
} from "../helpers/timeScale";
import type { PlannedSection, SisSectionMeeting } from "../types";

const props = defineProps<{ section: PlannedSection }>();

const LABEL_CLASS =
  "tw-m-0 tw-mb-px tw-block tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant";

const SUB_LABEL_CLASS =
  "tw-mb-0.5 tw-block tw-text-[11px] tw-text-on-surface-variant";

const VALUE_CLASS = "tw-text-[15px] tw-font-semibold";

/** "9:45 – 11:00 AM": the half is written once, on the end that carries it. */
const timeOf = (pattern: SisSectionMeeting) =>
  `${formatClock(minutesFromClock(pattern.startTime))} – ${formatTime(minutesFromClock(pattern.endTime))}`;

const durationOf = (pattern: SisSectionMeeting) =>
  minutesFromClock(pattern.endTime) - minutesFromClock(pattern.startTime);

const assistants = computed(() => assistantsOf(props.section.instructors));

const partners = computed(() => props.section.crosslist?.partners ?? []);

const notesSummary = computed(
  () => props.section.notes.trim().split("\n")[0] || "Empty",
);
</script>
