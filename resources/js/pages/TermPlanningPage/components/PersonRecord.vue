<!--
  One person on a section, with nothing to do to them. Bordered white cards
  are how this sheet draws a field; a record that cannot be changed is not a
  field, so it sits on the recessed surface instead.
-->
<template>
  <div
    class="tw-flex tw-items-center tw-gap-2.5 tw-rounded-[10px] tw-border tw-border-solid tw-border-surface-container tw-bg-surface tw-px-3 tw-py-[7px]"
  >
    <span
      class="tw-flex tw-h-7 tw-w-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-bg-outline-variant tw-text-[10px] tw-font-bold tw-text-on-surface-variant"
    >
      {{ initialsOf(instructor) }}
    </span>
    <div class="tw-min-w-0 tw-flex-1">
      <p class="tw-m-0 tw-truncate tw-text-[13.5px]">
        {{ instructor.name ?? "TBA" }}
      </p>
      <p class="tw-m-0 tw-text-[11px] tw-text-on-surface-variant">{{ role }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { initialsOf } from "../helpers/sectionPeople";
import type { SisInstructor } from "../types";

defineProps<{ instructor: SisInstructor; role: string }>();
</script>
