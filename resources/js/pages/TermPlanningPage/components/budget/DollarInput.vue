<template>
  <span class="tw-flex tw-h-full tw-min-w-0 tw-flex-col tw-justify-center">
    <input
      type="text"
      inputmode="decimal"
      :value="shownAmount"
      placeholder="No rate"
      :disabled="isDisabled"
      :aria-label="label"
      :aria-invalid="refusal !== null"
      class="tw-h-full tw-min-h-8 tw-w-full tw-min-w-0 tw-border-none tw-bg-transparent tw-px-2 tw-text-right tw-text-xs tw-font-semibold tw-tabular-nums tw-text-on-surface tw-outline-none placeholder:tw-font-normal placeholder:tw-text-on-surface-variant hover:tw-bg-surface focus:tw-bg-surface-bright focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary disabled:tw-cursor-default disabled:hover:tw-bg-transparent"
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
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { refusalOfDollars } from "../../helpers/dollarAmounts";
import { formatDollars } from "../../helpers/money";

const props = defineProps<{
  amount: number | null;
  isDisabled: boolean;
  label: string;
}>();

const emit = defineEmits<{ change: [amount: number | null] }>();

const refusal = ref<string | null>(null);

watch(
  () => props.amount,
  () => (refusal.value = null),
);

const shownAmount = computed(() =>
  props.amount === null ? "" : formatDollars(props.amount),
);

function onChange(event: Event) {
  const raw = (event.target as HTMLInputElement).value.replace(/[$,\s]/g, "");
  if (raw === "") {
    refusal.value = null;
    emit("change", null);
    return;
  }

  const amount = Number(raw);
  refusal.value = refusalOfDollars(amount);
  if (refusal.value === null) emit("change", amount);
}
</script>
