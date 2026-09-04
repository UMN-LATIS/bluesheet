<!-- The hairline between two fields of the section sheet. -->
<template>
  <div :class="cn('tw-h-px tw-bg-outline-variant', props.class)" />
</template>

<script setup lang="ts">
import type { CSSClass } from "@/types";
import { cn } from "@/utils";

const props = withDefaults(defineProps<{ class?: CSSClass }>(), { class: "" });
</script>
