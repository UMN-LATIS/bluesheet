<template>
  <div
    :class="
      cn(
        'tw-flex tw-min-w-0 tw-items-center tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-px-2',
        hasRightBorder && 'tw-border-r',
        align === 'end' && 'tw-justify-end tw-tabular-nums',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { CSSClass } from "@/types";
import { cn } from "@/utils";

const props = withDefaults(
  defineProps<{
    align?: "start" | "end";
    hasRightBorder?: boolean;
    class?: CSSClass;
  }>(),
  { align: "start", hasRightBorder: true, class: "" },
);
</script>
