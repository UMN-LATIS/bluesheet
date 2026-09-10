<template>
  <div
    role="status"
    class="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1.5 tw-border-0 tw-border-b tw-border-solid tw-border-outline-variant tw-bg-primary-container tw-px-3.5 tw-py-2"
  >
    <span class="tw-text-[13px] tw-font-semibold tw-text-on-surface">
      {{ sectionIds.length }}
      {{ sectionIds.length === 1 ? "section" : "sections" }} imported from
      {{ sourceTermName }}
    </span>

    <button
      type="button"
      class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[12.5px] tw-font-semibold tw-text-primary hover:tw-underline"
      @click="emit('show')"
    >
      Show these {{ sectionIds.length }}
    </button>

    <button
      type="button"
      class="tw-border-none tw-bg-transparent tw-p-0 tw-text-[12.5px] tw-font-semibold tw-text-primary hover:tw-underline disabled:tw-cursor-default disabled:tw-text-on-surface-variant"
      :class="{ 'tw-cursor-pointer': !isUndoing }"
      :disabled="isUndoing"
      @click="emit('undo')"
    >
      {{ isUndoing ? "Undoing…" : "Undo" }}
    </button>

    <button
      type="button"
      class="tw-ml-auto tw-flex tw-h-8 tw-w-8 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
      aria-label="Dismiss"
      @click="emit('dismiss')"
    >
      <XIcon class="tw-h-4 tw-w-4" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { XIcon } from "@/icons";

defineProps<{
  sectionIds: number[];
  sourceTermName: string;
  isUndoing: boolean;
}>();

const emit = defineEmits<{ show: []; undo: []; dismiss: [] }>();
</script>
