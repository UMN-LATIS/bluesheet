<!--
  The name of one field of the section sheet, worn the same whether the field
  takes an edit or only shows its value. `field` is a part of the sheet;
  `control` is one input inside a part that already has a name.
-->
<template>
  <component
    :is="props.for ? 'label' : 'span'"
    :for="props.for"
    :class="
      cn(
        'tw-m-0 tw-block tw-text-on-surface-variant',
        variant === 'field'
          ? 'tw-mb-2 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em]'
          : 'tw-mb-1.5 tw-text-[11px]',
        props.class,
      )
    "
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import type { CSSClass } from "@/types";
import { cn } from "@/utils";

const props = withDefaults(
  defineProps<{
    /** The id of the control this names. Without one it draws a plain span. */
    for?: string;
    variant?: "field" | "control";
    class?: CSSClass;
  }>(),
  { for: undefined, variant: "field", class: "" },
);
</script>
