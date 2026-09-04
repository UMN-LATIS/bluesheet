<!--
  One person on a section, with nothing to do to them. A tint and a box are
  how this sheet draws a field; a record that cannot be changed is not a
  field, so it is drawn as the page content it is.
-->
<template>
  <div class="tw-flex tw-items-center tw-gap-2.5">
    <span
      class="tw-flex tw-h-7 tw-w-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-bg-surface-container tw-text-[10px] tw-font-bold tw-text-on-surface-variant"
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
