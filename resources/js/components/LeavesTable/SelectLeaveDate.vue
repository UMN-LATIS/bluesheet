<template>
  <div class="tw-flex">
    <ComboBox
      v-if="!showCustomDateInput"
      :data-cy="`select-leave-date-combobox-${variant}`"
      :modelValue="localComboBoxValue"
      :label="variant === 'start' ? 'Leave Start Date' : 'Leave End Date'"
      :showLabel="false"
      :options="comboboxOptions"
      class="tw-w-40"
      :inputClass="{
        '!tw-border-red-500 tw-border tw-solid': !isDateValid,
      }"
      :canAddNewOption="true"
      :addNewOptionLabel="`Custom Date`"
      @addNewOption="showCustomDateInput = true"
      @update:modelValue="
        (comboboxOption) =>
          $emit('update:modelValue', comboboxOption?.id as string)
      "
    />
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
import { computed, ref, onMounted } from "vue";
import ComboBox, { ComboBoxOption } from "@/components/ComboBox.vue";
import InputGroup from "../InputGroup.vue";
import dayjs from "dayjs";
import { useTermPayrollDatesStore } from "@/stores/useTermPayrollDateStore";
import XIcon from "@/icons/XIcon.vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    variant?: "start" | "end";
    validator?: (value: unknown) => boolean;
  }>(),
  {
    modelValue: "",
    variant: "start",
    validator: () => true,
  },
);

defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const showCustomDateInput = ref(false);
const termPayrollDatesStore = useTermPayrollDatesStore();
onMounted(() => {
  termPayrollDatesStore.init();
});

const comboboxOptions = computed(() => {
  return termPayrollDatesStore.termPayrollDates.map((termPayrollDate) => {
    const date =
      props.variant === "start"
        ? termPayrollDate.payroll_start_date
        : termPayrollDate.payroll_end_date;

    return {
      id: date,
      label: dayjs(date).format("MM/DD/YYYY"),
      secondaryLabel: `${termPayrollDate.semester} ${termPayrollDate.year}`,
    };
  });
});

const localComboBoxValue = computed((): ComboBoxOption | null => {
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
