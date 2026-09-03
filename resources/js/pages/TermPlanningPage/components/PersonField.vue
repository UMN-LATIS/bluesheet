<!--
  One person on a section, with a way to take them off it. The editable twin
  of PersonRecord: a bordered card on the sheet's own surface, which is how
  this sheet draws anything that can be changed.
-->
<template>
  <div
    class="tw-flex tw-items-center tw-gap-2.5 tw-rounded-[10px] tw-border tw-border-solid tw-border-outline-variant tw-p-2 tw-pl-3"
  >
    <span
      class="tw-flex tw-h-7 tw-w-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-bg-surface-container tw-text-[10px] tw-font-bold tw-text-on-surface-variant"
    >
      {{ initialsOf(instructor) }}
    </span>
    <div class="tw-min-w-0 tw-flex-1">
      <p class="tw-m-0 tw-truncate tw-text-[13.5px] tw-text-on-surface">
        {{ instructor.name ?? "TBA" }}
      </p>
      <p class="tw-m-0 tw-text-[11px] tw-text-on-surface-variant">{{ role }}</p>
    </div>
    <button
      type="button"
      class="tw-flex tw-h-11 tw-w-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
      :aria-label="`Remove ${instructor.name ?? 'instructor'}`"
      @click="emit('remove')"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { initialsOf } from "../helpers/sectionPeople";
import type { SisInstructor } from "../types";

defineProps<{ instructor: SisInstructor; role: string }>();

const emit = defineEmits<{ remove: [] }>();
</script>
