<template>
  <span class="enrollment-tile" :data-step="step">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  enrollmentFillStepOf,
  type Enrollment,
} from "../helpers/enrollmentHistory";

const props = defineProps<{
  /** Null for a term the section did not run. */
  enrollment: Enrollment | null;
}>();

const step = computed(() =>
  props.enrollment ? enrollmentFillStepOf(props.enrollment) : undefined,
);
</script>

<style scoped>
.enrollment-tile {
  --tile-background: transparent;
  background-color: var(--tile-background);
  color: #262626;
}
.enrollment-tile[data-step="0"] {
  --tile-background: oklch(0.85 0.11 25);
}
.enrollment-tile[data-step="1"] {
  --tile-background: oklch(0.85 0.11 49);
}
.enrollment-tile[data-step="2"] {
  --tile-background: oklch(0.85 0.11 73);
}
.enrollment-tile[data-step="3"] {
  --tile-background: oklch(0.85 0.11 97);
}
.enrollment-tile[data-step="4"] {
  --tile-background: oklch(0.85 0.11 121);
}
.enrollment-tile[data-step="5"] {
  --tile-background: oklch(0.85 0.11 145);
}
</style>
