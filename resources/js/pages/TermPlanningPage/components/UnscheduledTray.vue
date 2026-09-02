<template>
  <section
    aria-label="Sections with no set time"
    class="tw-bg-white tw-px-3 tw-py-2"
  >
    <h2
      class="tw-m-0 tw-mb-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-neutral-500"
    >
      No set time
      <span class="tw-font-normal tw-normal-case tw-text-neutral-500">
        · {{ sections.length }}
      </span>
    </h2>

    <p
      v-if="sections.length === 0"
      class="tw-m-0 tw-text-xs tw-text-neutral-500"
    >
      Every section shown has a meeting time.
    </p>

    <!-- Three rows or so, then it scrolls: a department can have two hundred of these. -->
    <ul
      v-else
      class="tw-m-0 tw-flex tw-max-h-24 tw-list-none tw-flex-wrap tw-gap-1.5 tw-overflow-y-auto tw-p-0"
    >
      <li v-for="section in sections" :key="section.id">
        <button
          type="button"
          class="tw-flex tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-sm tw-border tw-border-solid tw-border-neutral-200 tw-py-0.5 tw-pl-1.5 tw-pr-1 tw-text-[11px] tw-leading-tight tw-text-neutral-800 hover:tw-border-neutral-400"
          :class="[
            colourOfType(section.component).block,
            {
              'tw-outline tw-outline-2 tw-outline-offset-1':
                section.id === selectedSectionId,
            },
          ]"
          :aria-pressed="section.id === selectedSectionId"
          @click="schedule.selectSection(section.id)"
        >
          <span class="tw-font-semibold">
            {{ section.subject }} {{ section.catalogNumber }} ·
            {{ section.section }}
          </span>
          <!--
            Who teaches it, at a glance: initials when someone is assigned, an
            empty dashed ring when nobody is. The ring is what a scheduler is
            scanning this strip for.
          -->
          <span
            v-if="initialsOf(section)"
            class="tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-neutral-200 tw-text-[9px] tw-font-semibold tw-text-neutral-700"
            :title="leadInstructorOf(section)?.name ?? undefined"
          >
            {{ initialsOf(section) }}
          </span>
          <span
            v-else
            class="tw-h-5 tw-w-5 tw-rounded-full tw-border tw-border-dashed tw-border-neutral-400"
            title="No instructor assigned"
            aria-label="No instructor assigned"
          />
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { colourOfType } from "../constants/meetingTypeColours";
import type { SisInstructor, SisSection } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

/**
 * The sections the grid cannot place because they have no meeting time.
 * Each is a chip that selects its section, so the sheet opens for it just
 * as it does for a block.
 */
defineProps<{
  sections: SisSection[];
  selectedSectionId: number | null;
  schedule: ScheduleEditor;
}>();

const leadInstructorOf = (section: SisSection): SisInstructor | undefined =>
  section.instructors.find(({ role }) => role === "PI") ??
  section.instructors[0];

/** "Ana García" → "AG". A last name alone gives its first letter. */
const initialsOf = (section: SisSection): string | null => {
  const instructor = leadInstructorOf(section);
  if (!instructor) return null;

  const words = (instructor.name ?? instructor.lastName ?? "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return null;

  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
};
</script>
