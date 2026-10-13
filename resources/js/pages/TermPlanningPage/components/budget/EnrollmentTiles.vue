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
  fillColorOf,
  shortTermLabel,
} from "../../helpers/enrollmentHistory";

const props = defineProps<{ history: EnrollmentPoint[] }>();

const hasHistory = computed(() =>
  props.history.some(({ offering }) => offering !== null),
);

function backgroundOf(offering: EnrollmentHistorySection | null): string {
  return offering ? fillColorOf(offering) : "transparent";
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
