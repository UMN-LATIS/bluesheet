<template>
  <div
    role="status"
    aria-label="Faculty on leave this term"
    class="tw-flex tw-max-h-36 tw-flex-wrap tw-items-center tw-gap-x-2.5 tw-gap-y-1.5 tw-overflow-y-auto tw-px-3.5 tw-py-2"
  >
    <span
      class="tw-flex-none tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
    >
      On leave
    </span>

    <TermLeaveChip v-for="leave in leaves" :key="leave.id" :leave="leave" />
  </div>
</template>

<script setup lang="ts">
import TermLeaveChip from "./TermLeaveChip.vue";
import type { TermLeave } from "@/types";

defineProps<{ leaves: TermLeave[] }>();
</script>
