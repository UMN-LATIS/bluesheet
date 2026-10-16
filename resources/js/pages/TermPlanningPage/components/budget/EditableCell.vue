<template>
  <span
    class="tw-relative tw-flex tw-h-full tw-min-w-0 tw-items-center"
    :class="{ 'tw-bg-accent-container-low': isOverridden }"
  >
    <ResetButton
      v-if="canEdit && isOverridden"
      class="tw-ml-1"
      :label="`Reset to ${resetValueLabel}`"
      @reset="emit('change', null)"
    />
    <span
      class="tw-flex tw-h-full tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center"
    >
      <input
        type="text"
        inputmode="decimal"
        :value="shownText"
        placeholder="No rate"
        :disabled="!canEdit"
        :aria-label="label"
        :aria-invalid="refusal !== null"
        class="tw-h-full tw-min-h-8 tw-w-full tw-min-w-0 tw-border-none tw-bg-transparent tw-px-2 tw-text-right tw-text-xs tw-font-semibold tw-tabular-nums tw-outline-none placeholder:tw-font-normal focus:tw-bg-surface-bright focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary disabled:tw-cursor-default"
        :class="
          canEdit
            ? 'tw-text-primary placeholder:tw-text-primary hover:tw-bg-surface'
            : 'tw-text-on-surface placeholder:tw-text-on-surface-variant'
        "
        @change="onChange"
      />
      <span
        v-if="refusal"
        role="alert"
        class="tw-px-2 tw-pb-1 tw-text-[11px] tw-text-brand"
      >
        {{ refusal }}
      </span>
    </span>
    <OverrideMarker v-if="isOverridden" />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import OverrideMarker from "./OverrideMarker.vue";
import ResetButton from "./ResetButton.vue";
import { refusalOfCredits } from "../../helpers/creditAmounts";
import { refusalOfDollars } from "../../helpers/dollarAmounts";
import { refusalOfHours } from "../../helpers/hourAmounts";
import { formatDollars } from "../../helpers/money";
import {
  formatPercent,
  parseFringeRate,
  refusalOfAppointmentPercent,
} from "../../helpers/percentAmounts";

const props = defineProps<{
  value: number | null;
  valueWithoutOverride: number | null;
  isOverridden: boolean;
  canEdit: boolean;
  kind: "dollars" | "percent" | "hours" | "count" | "appointment";
  label: string;
}>();

const emit = defineEmits<{ change: [value: number | null] }>();

const refusal = ref<string | null>(null);

watch(
  () => props.value,
  () => (refusal.value = null),
);

function formatAmount(amount: number): string {
  switch (props.kind) {
    case "dollars":
      return formatDollars(amount);
    case "percent":
      return formatPercent(amount);
    case "hours":
    case "count":
      return String(amount);
    case "appointment":
      return `${amount}%`;
  }
}

const shownText = computed(() =>
  props.value === null ? "" : formatAmount(props.value),
);

const resetValueLabel = computed(() =>
  props.valueWithoutOverride === null
    ? "no rate"
    : formatAmount(props.valueWithoutOverride),
);

function parsedAmountOf(
  text: string,
): { amount: number } | { refusal: string } {
  if (props.kind === "percent") {
    const parsed = parseFringeRate(text);
    return "fringeRate" in parsed ? { amount: parsed.fringeRate } : parsed;
  }

  const amount = Number(text.replace(/[$,%\s]/g, ""));
  const amountRefusal = refusalOf(amount);
  return amountRefusal === null ? { amount } : { refusal: amountRefusal };
}

function refusalOf(amount: number): string | null {
  switch (props.kind) {
    case "hours":
      return refusalOfHours(amount);
    case "count":
      return refusalOfCredits(amount);
    case "appointment":
      return refusalOfAppointmentPercent(amount);
    default:
      return refusalOfDollars(amount);
  }
}

function onChange(event: Event) {
  const text = (event.target as HTMLInputElement).value;
  if (text.trim() === "") {
    refusal.value = null;
    emit("change", null);
    return;
  }

  const parsed = parsedAmountOf(text);
  if ("refusal" in parsed) {
    refusal.value = parsed.refusal;
    return;
  }

  refusal.value = null;
  const isWithoutOverride = parsed.amount === props.valueWithoutOverride;
  emit("change", isWithoutOverride ? null : parsed.amount);
}
</script>
