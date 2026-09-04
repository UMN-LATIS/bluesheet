<!--
  The section as the term left it: every field of the sheet, read as its
  value. Read-only is a subtraction rather than a graying-out, so a field
  becomes plain text under the same label, in the same order — a scheduler
  reading a closed term learns the sheet they will use on an open one. What
  would have written is gone rather than dimmed: no remove ×, no Add, and
  nothing blue, since blue is what says "you can act on this".

  Nothing here takes a control, so the labels sit tighter against their values
  than the same labels do on the form.
-->
<template>
  <div
    class="scrollbar-always-visible tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-4 tw-overflow-y-auto tw-p-[18px]"
  >
    <div class="tw-flex tw-items-start tw-gap-8">
      <div>
        <FieldLabel class="tw-mb-px">Section</FieldLabel>
        <FactValue>{{ section.section }}</FactValue>
      </div>

      <div>
        <FieldLabel class="tw-mb-px">Enrollment</FieldLabel>
        <div class="tw-flex tw-items-baseline tw-gap-2">
          <FactValue>
            {{ section.enrollmentTotal }} / {{ section.enrollmentCap }}
          </FactValue>
          <span class="tw-text-xs tw-text-on-surface-variant">
            enrolled of cap
          </span>
        </div>
      </div>
    </div>

    <div>
      <FieldLabel class="tw-mb-px">Meets</FieldLabel>
      <FactValue v-if="section.meetings.length === 0">No set time</FactValue>
      <div
        v-for="(pattern, patternIndex) in section.meetings"
        :key="patternIndex"
        class="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2.5 tw-gap-y-1"
      >
        <FactValue>{{ daysMetSpelled(pattern.days) }}</FactValue>
        <span class="tw-text-[15px]">{{ timeOf(pattern) }}</span>
        <span
          class="tw-text-[11px] tw-font-semibold tw-text-on-surface-variant"
        >
          {{ durationOf(pattern) }} min
        </span>
      </div>
    </div>

    <div>
      <FieldLabel class="tw-mb-px">Taught by</FieldLabel>
      <div class="tw-flex tw-flex-col tw-gap-2">
        <PersonRecord
          v-for="instructor in instructorsOnRecord"
          :key="instructor.emplid"
          :instructor="instructor"
          role="Instructor of record"
        />
        <p
          v-if="instructorsOnRecord.length === 0"
          class="tw-m-0 tw-text-[13px] tw-text-on-surface-variant"
        >
          TBA
        </p>
      </div>
    </div>

    <!--
      Alongside the instructor of record rather than folded away below, since
      a discussion or a lab is usually run by the people in this list and the
      SIS names no instructor of record on it at all.
    -->
    <div>
      <FieldLabel class="tw-mb-px">Teaching assistants</FieldLabel>
      <div v-if="assistants.length > 0" class="tw-flex tw-flex-col tw-gap-2">
        <PersonRecord
          v-for="instructor in assistants"
          :key="instructor.emplid"
          :instructor="instructor"
          :role="instructor.role"
        />
      </div>
      <p v-else class="tw-m-0 tw-text-[13px] tw-text-on-surface-variant">
        None
      </p>
    </div>

    <FieldDivider />

    <div class="tw-overflow-hidden tw-rounded-[10px] tw-bg-surface">
      <Disclosure
        label="Component & delivery"
        :summary="`${section.component} · ${labelOfDelivery(section.delivery)}`"
      >
        <div class="tw-flex tw-gap-5">
          <div class="tw-min-w-0 tw-flex-1">
            <FieldLabel variant="control" class="tw-mb-0.5">
              Component
            </FieldLabel>
            <span class="tw-text-[13.5px]">
              {{ section.component }} —
              {{ labelOfComponent(section.component) }}
            </span>
          </div>
          <div class="tw-min-w-0 tw-flex-1">
            <FieldLabel variant="control" class="tw-mb-0.5">
              Delivery
            </FieldLabel>
            <span class="tw-text-[13.5px]">
              {{ labelOfDelivery(section.delivery) }}
            </span>
          </div>
        </div>
      </Disclosure>

      <FieldDivider class="tw-mx-3" />

      <Disclosure label="Cross-listings" :summary="crosslistSummary">
        <p
          v-if="partners.length === 0"
          class="tw-m-0 tw-text-[13px] tw-text-on-surface-variant"
        >
          This section is not listed under another number.
        </p>
        <div v-else class="tw-flex tw-flex-col tw-gap-1">
          <div
            v-for="partner in partners"
            :key="`${partner.subject}${partner.catalogNumber}${partner.section}`"
            class="tw-text-[13px]"
          >
            {{ partner.subject }} {{ partner.catalogNumber }} ·
            {{ partner.section }}
          </div>
        </div>
      </Disclosure>

      <FieldDivider class="tw-mx-3" />

      <Disclosure label="Notes" :summary="notesSummary">
        <p
          class="tw-m-0 tw-whitespace-pre-line tw-text-[13px]"
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
import FactValue from "./FactValue.vue";
import FieldDivider from "./FieldDivider.vue";
import FieldLabel from "./FieldLabel.vue";
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

/** "9:45 – 11:00 AM": the half is written once, on the end that carries it. */
const timeOf = (pattern: SisSectionMeeting) =>
  `${formatClock(minutesFromClock(pattern.startTime))} – ${formatTime(minutesFromClock(pattern.endTime))}`;

const durationOf = (pattern: SisSectionMeeting) =>
  minutesFromClock(pattern.endTime) - minutesFromClock(pattern.startTime);

const instructorsOnRecord = computed(() =>
  instructorsOfRecord(props.section.instructors),
);

const assistants = computed(() => assistantsOf(props.section.instructors));

const partners = computed(() => props.section.crosslist?.partners ?? []);

const crosslistSummary = computed(() =>
  partners.value.length === 0
    ? "None"
    : partners.value
        .map(
          (partner) =>
            `${partner.subject} ${partner.catalogNumber} · ${partner.section}`,
        )
        .join(", "),
);

const notesSummary = computed(
  () => props.section.notes.trim().split("\n")[0] || "Empty",
);
</script>
