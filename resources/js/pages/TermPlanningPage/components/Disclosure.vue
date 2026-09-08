<!--
  A named part of the sheet that stays shut until asked for, with what it
  holds legible on its header. The header works on a read-only term too,
  since looking is not changing, and it keeps its blue there: blue is what
  marks a control, and a control that works and does not say so is worse than
  one blue word in an otherwise inert panel.
-->
<template>
  <div class="tw-px-3">
    <button
      type="button"
      class="tw-flex tw-w-full tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-border-none tw-bg-transparent tw-p-0 tw-text-left"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <FieldLabel class="tw-mb-0 tw-flex-none">{{ label }}</FieldLabel>
      <NoteIcon
        v-if="isMarked"
        class="tw-h-3.5 tw-w-3.5 tw-flex-none tw-text-on-surface-variant"
        aria-label="Has a note"
      />
      <span
        class="tw-min-w-0 tw-truncate tw-text-[11px] tw-text-on-surface-variant"
      >
        {{ summary }}
      </span>
      <span
        class="tw-ms-auto tw-flex-none tw-text-xs tw-font-semibold tw-text-primary"
      >
        {{ isOpen ? "Hide" : "Show" }}
      </span>
    </button>

    <div v-if="isOpen" class="tw-pb-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import FieldLabel from "./FieldLabel.vue";
import { NoteIcon } from "@/icons";

defineProps<{
  label: string;
  /** Draws the note mark beside the label. */
  isMarked?: boolean;
  /** What the part holds, read without opening it: "DIS · On campus", "1". */
  summary: string;
}>();

const isOpen = ref(false);
</script>
