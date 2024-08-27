<template>
  <div class="">
    <ComboBox
      :modelValue="localComboBoxValue"
      :label="variant === 'start' ? 'Leave Start Date' : 'Leave End Date'"
      :showLabel="false"
      :options="comboboxOptions"
      @update:modelValue="
        (comboboxOption) =>
          $emit('update:modelValue', comboboxOption?.id as string)
      "
    />
    <button>...</button>
    <InputGroup
      label="Custom Leave Start Date"
      type="date"
      :modelValue="modelValue"
      :showLabel="false"
      @update:modelValue="$emit('update:modelValue', $event)"
    />
  </div>
</template>
<script setup lang="ts">
import { useLeaveDateOptions } from "@/composables/useLeaveDateOptions";
import { computed, ref } from "vue";
import ComboBox, { ComboBoxOption } from "@/components/ComboBox.vue";
import dayjs from "dayjs";
import InputGroup from "../InputGroup.vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    variant?: "start" | "end";
  }>(),
  {
    modelValue: "",
    variant: "start",
  },
);

defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const { startDateOptions } = useLeaveDateOptions();

interface DateTermInfo {
  date: string;
  term: string;
  payrollNumber: number;
}

type DateTermInfoLookup = Record<string, DateTermInfo>;

const dateToTermLookup = computed(() => {
  const dateTermInfoArr: DateTermInfo[] = [];

  // loop thru, assigning term week numbers
  for (let i = 0; i < startDateOptions.value.length; i++) {
    const currentOption = startDateOptions.value[i];
    const prevDateTermInfo = i === 0 ? null : dateTermInfoArr[i - 1];
    const isSameTerm = prevDateTermInfo?.term === currentOption.term;

    dateTermInfoArr.push({
      date: startDateOptions.value[i].date,
      term: startDateOptions.value[i].term,
      payrollNumber: isSameTerm ? prevDateTermInfo.payrollNumber + 1 : 1,
    });
  }

  // turn it into a lookup
  return dateTermInfoArr.reduce((acc, curr) => {
    acc[curr.date] = curr;
    return acc;
  }, {} as DateTermInfoLookup);
});

const toComboBoxOption = (dateTermInfo: DateTermInfo): ComboBoxOption => ({
  id: dateTermInfo.date,
  label: dayjs(dateTermInfo.date).format("MMM D, YYYY"),
  secondaryLabel: dateTermInfo.term
    ? `${dateTermInfo.term} - Payroll ${dateTermInfo.payrollNumber}`
    : undefined,
});

const localComboBoxValue = computed((): ComboBoxOption | null => {
  if (!props.modelValue) {
    return null;
  }
  const dateTermInfo = dateToTermLookup.value[props.modelValue];
  if (!dateTermInfo) {
    return null;
  }

  return toComboBoxOption(dateTermInfo);
});

const comboboxOptions = computed(() =>
  Object.values(dateToTermLookup.value).map(toComboBoxOption),
);
</script>
<style scoped></style>
