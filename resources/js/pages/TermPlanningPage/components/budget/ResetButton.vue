<template>
  <button
    type="button"
    :title="label"
    :aria-label="label"
    class="tw-flex tw-h-[26px] tw-w-[26px] tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border-none tw-bg-transparent tw-p-0 tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
    @click="emit('reset')"
  >
    <UndoIcon class="!tw-h-3.5 !tw-w-3.5" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { UndoIcon } from "@/icons";

defineProps<{ label: string }>();

const emit = defineEmits<{ reset: [] }>();
</script>
