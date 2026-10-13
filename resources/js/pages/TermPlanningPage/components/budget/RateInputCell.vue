<template>
  <BudgetCell
    class="tw-relative tw-px-0"
    :class="{ 'tw-bg-accent-container-low': isOverridden }"
  >
    <ResetButton
      v-if="canEdit && isOverridden"
      class="tw-ml-1"
      :label="`Reset to ${resetAmountLabel}`"
      @reset="emit('change', null)"
    />
    <DollarInput
      class="tw-flex-1"
      :amount="amount"
      :isDisabled="!canEdit"
      :label="label"
      @change="(changed) => emit('change', changed)"
    />
    <OverrideMarker v-if="isOverridden" />
  </BudgetCell>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BudgetCell from "./BudgetCell.vue";
import DollarInput from "./DollarInput.vue";
import OverrideMarker from "./OverrideMarker.vue";
import ResetButton from "./ResetButton.vue";
import { formatDollars } from "../../helpers/money";

const props = defineProps<{
  amount: number | null;
  /** Null when there is no rate beneath the override. */
  amountWithoutOverride: number | null;
  isOverridden: boolean;
  canEdit: boolean;
  label: string;
}>();

const emit = defineEmits<{ change: [amount: number | null] }>();

const resetAmountLabel = computed(() =>
  props.amountWithoutOverride === null
    ? "no rate"
    : formatDollars(props.amountWithoutOverride),
);
</script>
