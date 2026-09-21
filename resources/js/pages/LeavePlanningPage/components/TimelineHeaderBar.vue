<template>
  <div
    class="tw-flex tw-flex-none tw-items-center tw-gap-1.5 tw-border-0 tw-border-b tw-border-solid tw-border-outline-variant tw-px-3 tw-py-1.5"
  >
    <TermSelect
      label="First term"
      :terms="termOptions"
      :termCode="range?.startTermCode ?? null"
      @choose="emit('selectRangeStart', $event)"
    />
    <span class="tw-text-[13px] tw-text-on-surface-variant">–</span>
    <TermSelect
      label="Last term"
      :terms="termOptions"
      :termCode="range?.endTermCode ?? null"
      @choose="emit('selectRangeEnd', $event)"
    />

    <button
      v-if="canViewCourses"
      type="button"
      :aria-pressed="isHistoryShown"
      class="tw-ms-2 tw-flex tw-min-h-9 tw-cursor-pointer tw-items-center tw-gap-2 tw-whitespace-nowrap tw-rounded tw-border-none tw-bg-transparent tw-px-2 tw-text-xs tw-font-semibold hover:tw-bg-surface"
      :class="isHistoryShown ? 'tw-text-primary' : 'tw-text-on-surface'"
      @click="emit('toggleHistory')"
    >
      <span
        aria-hidden="true"
        class="tw-relative tw-h-4 tw-w-[26px] tw-flex-none tw-rounded-full"
        :class="isHistoryShown ? 'tw-bg-primary' : 'tw-bg-outline-variant'"
      >
        <span
          class="tw-absolute tw-top-0.5 tw-h-3 tw-w-3 tw-rounded-full tw-bg-surface-bright tw-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
          :class="isHistoryShown ? 'tw-left-3' : 'tw-left-0.5'"
        />
      </span>
      Teaching history
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PlanningTerm, PlanningTermRange } from "@/types";
import TermSelect from "./TermSelect.vue";
import { isDated } from "../helpers/timelineAxis";

const props = defineProps<{
  terms: PlanningTerm[];
  range: PlanningTermRange | null;
  canViewCourses: boolean;
  isHistoryShown: boolean;
}>();

const emit = defineEmits<{
  selectRangeStart: [termCode: number];
  selectRangeEnd: [termCode: number];
  toggleHistory: [];
}>();

const termOptions = computed(() =>
  props.terms.filter(isDated).sort((a, b) => a.termCode - b.termCode),
);
</script>
