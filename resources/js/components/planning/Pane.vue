<!--
  Every pane on this page is a card lifted off its own recessed surface: the
  filter rail, the canvas, and the detail sheet all read as the same object.
  Pass layout and placement in `class`; the card look comes from here.
-->
<template>
  <component
    :is="as"
    :class="
      cn(
        'tw-overflow-hidden tw-rounded-[14px] tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
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
    /** The tag to draw, where the pane is a landmark rather than a box. */
    as?: string;
    class?: CSSClass;
  }>(),
  { as: "div", class: "" },
);
</script>
