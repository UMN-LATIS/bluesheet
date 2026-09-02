<template>
  <button
    type="button"
    class="tw-relative tw-flex tw-w-full tw-cursor-pointer tw-rounded-[10px] tw-border tw-border-solid tw-border-outline-variant tw-border-l-4 tw-text-left hover:tw-border-outline"
    :class="[
      color.tint,
      color.rail,
      isSelected && [
        'tw-outline tw-outline-2 tw-outline-offset-0',
        // Ink where nothing can be acted on; see MeetingBlock.
        isReadOnly ? 'tw-outline-on-surface' : 'tw-outline-primary',
      ],
      isStacked
        ? 'tw-min-h-[62px] tw-flex-col tw-items-start tw-gap-0.5 tw-p-2.5 tw-px-3'
        : 'tw-min-h-14 tw-items-center tw-gap-2.5 tw-p-2.5 tw-px-3',
      item.section.isCancelled && 'tw-opacity-60',
    ]"
  >
    <span
      v-if="isEdited"
      class="tw-absolute tw-right-1.5 tw-top-1.5 tw-h-2 tw-w-2 tw-rounded-full tw-bg-accent tw-ring-1 tw-ring-inset tw-ring-black/20"
      title="Edited here, not saved anywhere"
    />

    <template v-if="isStacked">
      <div
        class="tw-flex tw-w-full tw-items-baseline tw-justify-between tw-gap-2"
      >
        <span
          class="tw-text-[13px] tw-font-bold tw-text-on-surface"
          :class="{ 'tw-line-through': item.section.isCancelled }"
        >
          {{ code }}
        </span>
        <span
          class="tw-text-[9.5px] tw-font-bold tw-tracking-[0.07em] tw-text-on-surface-variant"
        >
          {{ item.section.component }}
        </span>
      </div>
      <div class="tw-w-full tw-truncate tw-text-xs">{{ instructorName }}</div>
      <div class="tw-text-[11.5px] tw-text-on-surface-variant">
        {{ timeRange }}
      </div>
    </template>

    <template v-else>
      <div class="tw-min-w-0 tw-flex-1">
        <span
          class="tw-block tw-text-[13.5px] tw-font-bold"
          :class="{ 'tw-line-through': item.section.isCancelled }"
        >
          {{ code }}
        </span>
        <span
          class="tw-block tw-truncate tw-text-xs tw-text-on-surface-variant"
        >
          {{ instructorName }} · {{ timeRange }}
        </span>
      </div>
      <span
        class="tw-flex-none tw-text-[9.5px] tw-font-bold tw-tracking-[0.07em] tw-text-on-surface-variant"
      >
        {{ item.section.component }}
      </span>
    </template>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { colorOfType } from "../constants/meetingTypeColors";
import type { DayBandItem } from "../helpers/dayBands";
import { formatTimeRange } from "../helpers/timeScale";
import type { SisInstructor } from "../types";
import type { ScreenSize } from "../useScreenSize";

const props = defineProps<{
  item: DayBandItem;
  size: ScreenSize;
  isSelected: boolean;
  isEdited: boolean;
  isReadOnly?: boolean;
}>();

// The grid has room for a time axis; this list never does, so a card only
// ever opens the sheet. Moving or resizing a meeting happens there instead.
const isStacked = computed(() => props.size !== "small");

const color = computed(() => colorOfType(props.item.section.component));

const code = computed(
  () =>
    `${props.item.section.subject} ${props.item.section.catalogNumber} · ${props.item.section.section}`,
);

const leadInstructor = computed<SisInstructor | undefined>(
  () =>
    props.item.section.instructors.find(({ role }) => role === "PI") ??
    props.item.section.instructors[0],
);

const instructorName = computed(() => {
  const instructor = leadInstructor.value;
  return instructor?.lastName ?? instructor?.name ?? "TBA";
});

const timeRange = computed(() =>
  formatTimeRange(props.item.startMinute, props.item.endMinute),
);
</script>
