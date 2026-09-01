<template>
  <div
    class="tw-absolute tw-inset-x-1 tw-box-border tw-overflow-hidden tw-rounded tw-border tw-border-solid tw-px-1.5 tw-py-1 tw-text-[11px] tw-leading-tight"
    :class="appearance"
    :style="{
      top: topOf(startMinute),
      height: heightOf(startMinute, endMinute),
    }"
  >
    <span class="tw-font-semibold">{{ formatClock(startMinute) }}</span>
    <span class="tw-opacity-70"> – {{ formatClock(endMinute) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatClock, heightOf, topOf } from "../helpers/timeScale";

const props = defineProps<{
  startMinute: number;
  endMinute: number;
  /** While the pointer is still down drawing it out, before it is committed. */
  isDraft?: boolean;
  /** While it is being carried to a new day or time. */
  isDragging?: boolean;
}>();

const appearance = computed(() => {
  if (props.isDraft) {
    return "tw-border-dashed tw-border-umn-maroon tw-bg-umn-maroon/10 tw-text-umn-maroon";
  }

  const solid = "tw-border-blue-500 tw-bg-blue-100 tw-text-blue-900";

  // Lifted above its neighbours while carried, so it is never hidden behind
  // one it is passing over.
  return props.isDragging
    ? `${solid} tw-z-20 tw-cursor-grabbing tw-shadow-lg`
    : `${solid} tw-cursor-grab`;
});
</script>
