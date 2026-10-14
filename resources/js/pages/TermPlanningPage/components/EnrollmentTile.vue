<template>
  <span
    class="enrollment-tile"
    :data-step="step"
    :data-palette="isReadOnly ? 'grey' : 'color'"
  >
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
  isReadOnly: boolean;
}>();

const step = computed(() =>
  props.enrollment ? enrollmentFillStepOf(props.enrollment) : undefined,
);
</script>

<style scoped>
.enrollment-tile {
  --tile-background: transparent;
  --tile-color: inherit;
  background-color: var(--tile-background);
  color: var(--tile-color);
}

.enrollment-tile[data-palette="grey"] {
  --tile-color: #262626;
}
.enrollment-tile[data-palette="grey"][data-step="0"] {
  --tile-background: oklch(0.94 0 0);
}
.enrollment-tile[data-palette="grey"][data-step="1"] {
  --tile-background: oklch(0.84 0 0);
}
.enrollment-tile[data-palette="grey"][data-step="2"] {
  --tile-background: oklch(0.74 0 0);
}
.enrollment-tile[data-palette="grey"][data-step="3"] {
  --tile-background: oklch(0.64 0 0);
}
.enrollment-tile[data-palette="grey"][data-step="4"] {
  --tile-background: oklch(0.54 0 0);
  --tile-color: #ffffff;
}
.enrollment-tile[data-palette="grey"][data-step="5"] {
  --tile-background: oklch(0.44 0 0);
  --tile-color: #ffffff;
}

.enrollment-tile[data-palette="color"] {
  --tile-color: #262626;
}
.enrollment-tile[data-palette="color"][data-step="0"] {
  --tile-background: oklch(0.85 0.11 25);
}
.enrollment-tile[data-palette="color"][data-step="1"] {
  --tile-background: oklch(0.85 0.11 49);
}
.enrollment-tile[data-palette="color"][data-step="2"] {
  --tile-background: oklch(0.85 0.11 73);
}
.enrollment-tile[data-palette="color"][data-step="3"] {
  --tile-background: oklch(0.85 0.11 97);
}
.enrollment-tile[data-palette="color"][data-step="4"] {
  --tile-background: oklch(0.85 0.11 121);
}
.enrollment-tile[data-palette="color"][data-step="5"] {
  --tile-background: oklch(0.85 0.11 145);
}
</style>
