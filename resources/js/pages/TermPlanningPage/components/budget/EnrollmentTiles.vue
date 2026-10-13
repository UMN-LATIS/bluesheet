<template>
  <span
    v-if="hasHistory"
    role="img"
    :aria-label="summary"
    class="tw-flex tw-items-center tw-gap-0.5"
  >
    <span
      v-for="tile in tiles"
      :key="tile.termCode"
      :title="tile.title"
      class="tw-box-border tw-flex tw-h-[22px] tw-w-5 tw-flex-none tw-items-center tw-justify-center tw-rounded-sm tw-text-[9.5px] tw-font-semibold tw-leading-none tw-tracking-tight tw-tabular-nums tw-text-[#262626]"
      :class="{
        'tw-border tw-border-dashed tw-border-outline-variant':
          tile.enrollment === null,
      }"
      :style="{ background: tile.background }"
    >
      {{ tile.enrollment ?? "" }}
    </span>
  </span>
  <span v-else class="tw-self-center tw-text-[11px] tw-text-on-surface-variant">
    New
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EnrollmentHistorySection } from "@/types";
import {
  type EnrollmentPoint,
  shortTermLabel,
} from "../../helpers/enrollmentHistory";

const props = defineProps<{ history: EnrollmentPoint[] }>();

const hasHistory = computed(() =>
  props.history.some(({ offering }) => offering !== null),
);

const RED_HUE = 25;
const GREEN_HUE = 145;
const RED_UP_TO_FILL = 0.4;
const GREEN_FROM_FILL = 0.95;

const clampToUnit = (fraction: number) => Math.min(1, Math.max(0, fraction));

function backgroundOf(offering: EnrollmentHistorySection | null): string {
  if (!offering) return "transparent";

  const fill =
    offering.enrollmentCap > 0
      ? clampToUnit(offering.enrollmentTotal / offering.enrollmentCap)
      : 1;
  const redToGreenFraction = clampToUnit(
    (fill - RED_UP_TO_FILL) / (GREEN_FROM_FILL - RED_UP_TO_FILL),
  );
  const hue = RED_HUE + redToGreenFraction * (GREEN_HUE - RED_HUE);

  return `oklch(0.85 0.11 ${hue.toFixed(0)})`;
}

function titleOf(termLabel: string, offering: EnrollmentHistorySection | null) {
  if (!offering) return `${termLabel}: not offered`;

  const { enrollmentTotal, enrollmentCap, leadInstructorLastName } = offering;
  const percentFull =
    enrollmentCap > 0
      ? ` (${Math.round((enrollmentTotal / enrollmentCap) * 100)}% full)`
      : "";

  return `${termLabel}: ${enrollmentTotal}/${enrollmentCap}${percentFull} · ${leadInstructorLastName ?? "no instructor"}`;
}

const summary = computed(() =>
  tiles.value.map(({ title }) => title).join("; "),
);

const tiles = computed(() =>
  props.history.map(({ termCode, offering }) => ({
    termCode,
    enrollment: offering?.enrollmentTotal ?? null,
    background: backgroundOf(offering),
    title: titleOf(shortTermLabel(termCode), offering),
  })),
);
</script>
