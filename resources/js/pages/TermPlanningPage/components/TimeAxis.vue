<template>
  <div class="tw-w-14 tw-flex-none">
    <ColumnHeader />
    <div class="tw-relative" :style="{ height: COLUMN_HEIGHT }">
      <div
        v-for="minute in HOUR_MARKS"
        :key="minute"
        class="-tw-translate-y-1/2 tw-absolute tw-right-1.5 tw-whitespace-nowrap tw-text-[11px] tw-leading-none tw-text-neutral-400"
        :style="{ top: topOf(minute) }"
      >
        {{ formatHour(minute) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ColumnHeader from "./ColumnHeader.vue";
import {
  COLUMN_HEIGHT,
  HOUR_MARKS,
  formatHour,
  topOf,
} from "../helpers/timeScale";
</script>
