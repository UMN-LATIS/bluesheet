<template>
  <button
    type="button"
    class="tw-ml-auto tw-flex tw-min-h-7 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-px-3 tw-text-[11.5px] tw-font-semibold tw-text-on-surface hover:tw-border-outline"
  >
    <UndoIcon class="!tw-h-3.5 !tw-w-3.5" aria-hidden="true" />
    Reset all
  </button>
</template>

<script setup lang="ts">
import { UndoIcon } from "@/icons";
</script>
