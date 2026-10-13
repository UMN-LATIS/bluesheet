<template>
  <span class="tw-flex tw-flex-col tw-gap-0.5">
    <span
      class="tw-flex tw-h-[26px] tw-items-center tw-rounded-md tw-border tw-border-solid tw-px-1.5 tw-text-on-surface-variant"
      :class="
        isChanged
          ? 'tw-border-[#e0a800] tw-bg-accent-container-low'
          : 'tw-border-outline-variant tw-bg-surface-bright'
      "
    >
      <span aria-hidden="true">$</span>
      <input
        type="number"
        min="0"
        step="0.01"
        :value="shownAmount"
        :placeholder="placeholder"
        :disabled="isDisabled"
        :aria-label="label"
        :aria-invalid="refusal !== null"
        class="tw-w-full tw-min-w-0 tw-border-none tw-bg-transparent tw-text-right tw-text-xs tw-text-on-surface tw-outline-none disabled:tw-cursor-default"
        @input="onInput"
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

const props = withDefaults(
  defineProps<{
    amount: number | null;
    isChanged: boolean;
    isDisabled: boolean;
    label: string;
    placeholder?: string;
  }>(),
  { placeholder: "" },
);

const emit = defineEmits<{ change: [amount: number | null] }>();

const refusal = ref<string | null>(null);

const shownAmount = computed(() => {
  const { amount } = props;
  if (amount === null) return "";

  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
});

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value.trim();
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
