<template>
  <div v-if="!isChoosingCustomDate" class="tw-flex">
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
    <button
      class="tw-bg-transparent tw-border-none"
      @click="isChoosingCustomDate = true"
    >
      <VDotsIcon />
      <span class="sr-only">Custom Leave Start Date</span>
    </button>
  </div>
  <div v-else class="tw-flex">
    <InputGroup
      label="Custom Leave Start Date"
      type="date"
      :modelValue="modelValue"
      :showLabel="false"
      @update:modelValue="$emit('update:modelValue', $event)"
    />
    <button
      class="tw-bg-transparent tw-border-none"
      @click="isChoosingCustomDate = false"
    >
      <VDotsIcon />
      <span class="sr-only">Choose from available leave dates</span>
    </button>
  </div>
</template>
<script setup lang="ts">
import { useLeaveDateOptions } from "@/composables/useLeaveDateOptions";
import { computed, ref, onMounted } from "vue";
import ComboBox, { ComboBoxOption } from "@/components/ComboBox.vue";
import dayjs from "dayjs";
import InputGroup from "../InputGroup.vue";
import { CalendarIcon, VDotsIcon } from "@/icons";

interface DateTermInfo {
  date: string;
  term: string;
  weekNumber: number;
}

type DateTermInfoLookup = Record<string, DateTermInfo>;

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

const isChoosingCustomDate = ref(false);
const { startDateOptions } = useLeaveDateOptions();

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
      // add 2 since payroll is bi-weekly
      weekNumber: isSameTerm ? prevDateTermInfo.weekNumber + 2 : 1,
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
  label: dayjs(dateTermInfo.date).format("MM/DD/YYYY"),
  secondaryLabel: dateTermInfo.term
    ? `${dateTermInfo.term} - Wk ${dateTermInfo.weekNumber}`
    : "-",
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

const isComboBoxOption = (value: string): boolean => {
  return !!dateToTermLookup.value[value];
};

onMounted(() => {
  if (!props.modelValue) {
    return;
  }

  if (!isComboBoxOption(props.modelValue)) {
    isChoosingCustomDate.value = true;
  }
});
</script>
<style scoped></style>
