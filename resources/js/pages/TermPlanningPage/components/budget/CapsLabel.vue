<template>
  <span
    :class="
      cn(
        'tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant',
        props.class,
      )
    "
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { CSSClass } from "@/types";
import { cn } from "@/utils";

const props = withDefaults(defineProps<{ class?: CSSClass }>(), { class: "" });
</script>
