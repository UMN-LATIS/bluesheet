<template>
  <span class="tw-flex tw-flex-col tw-gap-0.5">
    <span
      class="tw-flex tw-h-[26px] tw-items-center tw-rounded-md tw-border tw-border-solid tw-px-1.5 tw-text-on-surface-variant focus-within:tw-ring-2 focus-within:tw-ring-primary"
      :class="{
        'tw-border-transparent tw-bg-transparent': isDisabled,
        'tw-border-[#e0a800] tw-bg-accent-container-low':
          !isDisabled && isOverridden,
        'tw-border-outline-variant tw-bg-surface-bright':
          !isDisabled && !isOverridden,
      }"
    >
      <span aria-hidden="true">$</span>
      <input
        type="text"
        inputmode="decimal"
        :value="shownAmount"
        placeholder="No rate"
        :disabled="isDisabled"
        :aria-label="label"
        :aria-invalid="refusal !== null"
        class="tw-w-full tw-min-w-0 tw-border-none tw-bg-transparent tw-text-right tw-text-xs tw-text-on-surface tw-outline-none disabled:tw-cursor-default"
        @change="onChange"
      />
    </span>
    <span v-if="refusal" role="alert" class="tw-text-[11px] tw-text-brand">
      {{ refusal }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { refusalOfDollars } from "../../helpers/dollarAmounts";

const props = defineProps<{
  amount: number | null;
  isOverridden: boolean;
  isDisabled: boolean;
  label: string;
}>();

const emit = defineEmits<{ change: [amount: number | null] }>();

const refusal = ref<string | null>(null);

const shownAmount = computed(() => {
  const { amount } = props;
  if (amount === null) return "";

  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
});

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
