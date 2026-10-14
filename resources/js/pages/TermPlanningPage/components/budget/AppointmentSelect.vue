<template>
  <span
    class="tw-relative tw-flex tw-h-full tw-min-w-0 tw-items-center"
    :class="{ 'tw-bg-accent-container-low': isOverridden }"
  >
    <ResetButton
      v-if="canEdit && isOverridden"
      class="tw-ml-1"
      :label="`Reset to ${DEFAULT_APPOINTMENT_PERCENT}%`"
      @reset="emit('change', null)"
    />
    <select
      :value="appointmentPercent"
      :disabled="!canEdit"
      :aria-label="label"
      class="tw-h-full tw-min-h-8 tw-w-full tw-min-w-0 tw-cursor-pointer tw-appearance-none tw-border-none tw-bg-transparent tw-px-2 tw-text-right tw-text-xs tw-font-semibold tw-tabular-nums tw-outline-none focus:tw-bg-surface-bright focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary disabled:tw-cursor-default"
      :class="
        canEdit ? 'tw-text-primary hover:tw-bg-surface' : 'tw-text-on-surface'
      "
      @change="
        emit('change', Number(($event.target as HTMLSelectElement).value))
      "
    >
      <option v-for="percent in options" :key="percent" :value="percent">
        {{ percent }}%
      </option>
    </select>
    <OverrideMarker v-if="isOverridden" />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import OverrideMarker from "./OverrideMarker.vue";
import ResetButton from "./ResetButton.vue";
import { DEFAULT_APPOINTMENT_PERCENT } from "../../helpers/gradCost";

const props = defineProps<{
  appointmentPercent: number;
  /** The term's levels. The current appointment is listed even when absent. */
  levels: number[];
  isOverridden: boolean;
  canEdit: boolean;
  label: string;
}>();

const emit = defineEmits<{ change: [appointmentPercent: number | null] }>();

const options = computed(() =>
  [...new Set([...props.levels, props.appointmentPercent])].sort(
    (a, b) => a - b,
  ),
);
</script>
