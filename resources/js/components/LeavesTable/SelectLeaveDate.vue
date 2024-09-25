<template>
  <div class="tw-flex">
    <ComboBox
      v-if="!showCustomDateInput"
      :data-cy="`select-leave-date-combobox-${variant}`"
      :modelValue="localComboBoxValue"
      :label="variant === 'start' ? 'Leave Start Date' : 'Leave End Date'"
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
    <div v-else class="tw-flex">
      <InputGroup
        :data-cy="`select-leave-date-input-${variant}`"
        label="Custom Leave Start Date"
        type="date"
        :modelValue="modelValue"
        :showLabel="false"
        class="tw-w-40"
        :validator="validator"
        :validateWhenUntouched="true"
        @update:modelValue="$emit('update:modelValue', $event)"
      />
      <button
        class="tw-bg-transparent tw-border-none"
        title="cancel custom date"
        @click="showCustomDateInput = !showCustomDateInput"
      >
        <XIcon />
        <span class="sr-only">Cancel custom date</span>
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { ComboBox, ComboBoxOptionType } from "@/components/ComboBox";
import InputGroup from "../InputGroup.vue";
import Button from "../Button.vue";
import dayjs from "dayjs";
import { useTermPayrollDatesStore } from "@/stores/useTermPayrollDateStore";
import XIcon from "@/icons/XIcon.vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    variant?: "start" | "end";
    isOptionDisabled?: (opt: ComboBoxOptionType) => boolean;
    validator?: (value: unknown) => boolean;
  }>(),
  {
    modelValue: "",
    variant: "start",
    isOptionDisabled: () => false,
    validator: () => true,
  },
);

defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const showCustomDateInput = ref(false);
const termPayrollDatesStore = useTermPayrollDatesStore();
onMounted(async () => {
  await termPayrollDatesStore.init();
});

const isCustomDate = computed(
  () =>
    !!props.modelValue &&
    comboboxOptions.value.every((option) => option.id !== props.modelValue),
);

const comboboxOptions = computed(() => {
  return termPayrollDatesStore.termPayrollDates
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
