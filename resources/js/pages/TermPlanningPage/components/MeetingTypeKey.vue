<template>
  <ul
    class="tw-m-0 tw-flex tw-list-none tw-items-center tw-gap-3 tw-p-0"
    aria-label="Block colours"
  >
    <li
      v-for="entry in entries"
      :key="entry.label"
      class="tw-flex tw-items-center tw-gap-1.5"
    >
      <span
        class="tw-h-3 tw-w-4 tw-rounded-sm tw-border tw-border-solid tw-border-neutral-200 tw-border-l-[3px]"
        :class="entry.swatch"
        aria-hidden="true"
      />
      {{ entry.label }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import {
  MEETING_TYPE_COLOURS,
  OTHER_TYPE_COLOUR,
} from "../constants/meetingTypeColours";

/** Reads from the same table the blocks paint from, so the two cannot drift. */
const entries = [...Object.values(MEETING_TYPE_COLOURS), OTHER_TYPE_COLOUR];
</script>
