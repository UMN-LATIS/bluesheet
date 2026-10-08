<template>
  <span v-if="hasHistory" class="tw-flex tw-items-end tw-gap-0.5">
    <span
      v-for="bar in bars"
      :key="bar.termCode"
      :title="bar.title"
      class="tw-flex tw-w-[18px] tw-flex-none tw-flex-col tw-items-center tw-gap-px"
    >
      <span class="tw-flex tw-h-4 tw-w-full tw-items-end tw-justify-center">
        <span
          class="tw-block tw-w-2 tw-rounded-t-[1px]"
          :class="bar.isFall ? 'tw-bg-on-surface-variant' : 'tw-bg-outline'"
          :style="{ height: bar.height }"
        />
      </span>
      <span
        class="tw-text-[9.5px] tw-leading-none tw-tabular-nums"
        :class="
          bar.enrollment === null ? 'tw-text-outline' : 'tw-text-on-surface'
        "
      >
        {{ bar.enrollment ?? "·" }}
      </span>
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

const BAR_PIXELS = 16;

const props = defineProps<{ history: EnrollmentPoint[] }>();

const hasHistory = computed(() =>
  props.history.some(({ offering }) => offering !== null),
);

function barHeightOf(enrollment: number | null, largestEnrollment: number) {
  if (enrollment === null) return "0px";

  return `${Math.max(2, (enrollment / largestEnrollment) * BAR_PIXELS)}px`;
}

function barTitleOf(
  termLabel: string,
  offering: EnrollmentHistorySection | null,
) {
  if (!offering) return `${termLabel}: not offered`;

  return `${termLabel}: ${offering.enrollmentTotal}/${offering.enrollmentCap} · ${offering.leadInstructorLastName ?? "no instructor"}`;
}

const bars = computed(() => {
  const largestEnrollment = Math.max(
    1,
    ...props.history.map(({ offering }) => offering?.enrollmentTotal ?? 0),
  );

  return props.history.map(({ termCode, offering }) => {
    const enrollment = offering?.enrollmentTotal ?? null;

    return {
      termCode,
      enrollment,
      isFall: termCode % 10 === 9,
      height: barHeightOf(enrollment, largestEnrollment),
      title: barTitleOf(shortTermLabel(termCode), offering),
    };
  });
});
</script>
