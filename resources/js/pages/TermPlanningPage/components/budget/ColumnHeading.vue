<template>
  <CapsLabel
    :class="
      cn(
        'tw-border-0 tw-border-b tw-border-solid tw-border-outline-variant tw-px-2 !tw-py-[7px]',
        props.class,
      )
    "
  >
    <slot />
  </CapsLabel>
</template>

<script setup lang="ts">
import type { CSSClass } from "@/types";
import { cn } from "@/utils";
import CapsLabel from "./CapsLabel.vue";

const props = withDefaults(defineProps<{ class?: CSSClass }>(), { class: "" });
</script>
