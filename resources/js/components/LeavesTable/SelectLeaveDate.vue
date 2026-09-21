<template>
  <div
    class="select-leave-date tw-flex tw-flex-col"
    :class="{
      'tw-pt-3': !isDateValid && errorText,
    }"
  >
    <ComboBox
      v-if="!showCustomDateInput"
      :data-cy="`select-leave-date-combobox-${variant}`"
      :modelValue="localComboBoxValue"
      :label="dateLabel"
      :showLabel="false"
      :options="comboboxOptions"
      teleportTo="body"
      class="tw-w-40"
      :inputClass="{
        '!tw-border-red-500 tw-border tw-solid': !isDateValid,
      }"
      @update:modelValue="
        (comboboxOption) =>
          $emit('update:modelValue', comboboxOption?.id as string)
      "
    >
      <template #afterOptions>
        <Button @click="showCustomDateInput = true"> Custom Date </Button>
      </template>
    </ComboBox>
    <div
      v-else
      class="tw-flex tw-w-40 tw-items-center tw-justify-between tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-px-4 tw-py-3 focus-within:tw-ring-2 focus-within:tw-ring-blue-500"
      :class="isDateValid ? 'tw-border-neutral-300' : 'tw-border-red-500'"
    >
      <div class="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-start">
        <input
          :data-cy="`select-leave-date-input-${variant}`"
          type="date"
          :value="modelValue"
          :aria-label="`${dateLabel}, custom date`"
          class="tw-w-full tw-border-none tw-bg-transparent tw-p-0 tw-text-sm focus:tw-outline-none"
          @input="
            $emit(
              'update:modelValue',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <span class="tw-text-xs tw-text-neutral-500">Custom date</span>
      </div>
      <button
        type="button"
        class="tw-flex tw-h-6 tw-w-6 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-text-neutral-900"
        title="Pick a term date instead"
        @click="showCustomDateInput = false"
      >
        <XIcon class="!tw-h-4 !tw-w-4" />
        <span class="tw-sr-only">Pick a term date instead</span>
      </button>
    </div>
    <span v-if="!isDateValid && errorText" class="tw-text-xs tw-text-red-600">{{
      errorText
    }}</span>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { ComboBox, ComboBoxOptionType } from "@/components/ComboBox";
import Button from "../Button.vue";
import dayjs from "dayjs";
import * as T from "@/types";
import { useTermPayrollDatesStore } from "@/stores/useTermPayrollDateStore";
import XIcon from "@/icons/XIcon.vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    variant?: "start" | "end";
    isOptionDisabled?: (opt: ComboBoxOptionType) => boolean;
    validator?: (value: unknown) => boolean;
    errorText?: string;
    /** Callers already holding the dates pass them rather than
     * waking the Pinia store a second time. */
    payrollDates?: T.TermPayrollDate[];
  }>(),
  {
    modelValue: "",
    variant: "start",
    isOptionDisabled: () => false,
    validator: () => true,
    errorText: "",
    payrollDates: undefined,
  },
);

defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const dateLabel = computed(() =>
  props.variant === "start" ? "Leave start date" : "Leave end date",
);

const showCustomDateInput = ref(false);
const termPayrollDatesStore = useTermPayrollDatesStore();
onMounted(async () => {
  if (props.payrollDates) return;
  await termPayrollDatesStore.init();
});

const payrollDates = computed(
  () => props.payrollDates ?? termPayrollDatesStore.termPayrollDates,
);

const isCustomDate = computed(
  () =>
    !!props.modelValue &&
    comboboxOptions.value.every((option) => option.id !== props.modelValue),
);

const comboboxOptions = computed(() => {
  return payrollDates.value
    .map((termPayrollDate) => {
      const date =
        props.variant === "start"
          ? termPayrollDate.payroll_start_date
          : termPayrollDate.payroll_end_date;

      return {
        id: date,
        label: dayjs(date).format("MM/DD/YYYY"),
        secondaryLabel: `${termPayrollDate.semester} ${termPayrollDate.year}`,
      };
    })
    .filter((option) => !props.isOptionDisabled(option));
});

// if combobox options update (e.g. when term payroll dates are loaded,
// or the valid end dates change), re-check if the current modelValue
// is a custom date and show the custom date input
watch(
  comboboxOptions,
  () => {
    showCustomDateInput.value = isCustomDate.value;
  },
  { immediate: true },
);

const localComboBoxValue = computed((): ComboBoxOptionType | null => {
  if (!props.modelValue) {
    return null;
  }

  const selectedOption = comboboxOptions.value.find(
    (option) => option.id === props.modelValue,
  );

  return selectedOption ?? null;
});

const isDateValid = computed(() => {
  return props.validator(props.modelValue);
});
</script>
<style scoped></style>
