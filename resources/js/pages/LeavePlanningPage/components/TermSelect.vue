<template>
  <label class="tw-m-0 tw-flex tw-items-center tw-font-normal">
    <span class="tw-sr-only">{{ label }}</span>
    <select
      class="tw-min-h-11 tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-py-1.5 tw-pl-3.5 tw-pr-8 tw-text-[13px] tw-font-semibold tw-text-on-surface roomy:tw-min-h-0"
      :value="termId ?? undefined"
      @change="
        emit('choose', Number(($event.target as HTMLSelectElement).value))
      "
    >
      <option v-for="term in terms" :key="term.id" :value="term.id">
        {{ term.name }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import type { PlanningTerm } from "@/types";

defineProps<{
  label: string;
  terms: PlanningTerm[];
  termId: number | null;
}>();

const emit = defineEmits<{ choose: [termId: number] }>();
</script>
