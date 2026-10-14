<template>
  <span class="tw-flex tw-min-w-0 tw-flex-col tw-items-end tw-tabular-nums">
    <MissingRate v-if="dollars === null" />
    <template v-else>
      <span>{{ formatWholeDollars(dollars) }}</span>
      <CellSubline v-if="$slots.default"><slot /></CellSubline>
    </template>
  </span>
</template>

<script setup lang="ts">
import CellSubline from "./CellSubline.vue";
import MissingRate from "./MissingRate.vue";
import { formatWholeDollars } from "../../helpers/money";

defineProps<{ dollars: number | null }>();
</script>
