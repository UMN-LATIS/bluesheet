<template>
  <div class="">
    <!-- <select v-if="variant === 'start'" :value="modelValue">
      <option value="">-- Select a date --</option>
      <option v-for="opt in startDateOptions" :key="opt.date" :value="opt.date">
        {{ opt.date }} - {{ opt.term }}
      </option>
    </select> -->
    <ComboBox
      :modelValue="localComboBoxValue"
      :label="variant === 'start' ? 'Leave Start Date' : 'Leave End Date'"
      :showLabel="false"
      :options="comboboxOptions"
    />
  </div>
</template>
<script setup lang="ts">
import { useLeaveDateOptions } from "@/composables/useLeaveDateOptions";
import { computed, ref } from "vue";
import ComboBox, { ComboBoxOption } from "@/components/ComboBox.vue";

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

interface TermLabelLookup {
  [date: string]: {
    date: string;
    term: string;
    weekNumber: number;
  };
}

const dateToTermLookup = computed(() => {
  return startDateOptions.value.reduce(
    (acc, option, index): TermLabelLookup => {
      const previousTerm = index === 0 ? acc[index - 1] : null;

      if (!previousTerm) {
        acc[option.date] = {
          date: option.date,
          term: option.term,
          weekNumber: 1,
        };
        return acc;
      }

      const isNewTerm = option.term === previousTerm.term;

      acc[option.date] = {
        date: option.date,
        term: option.term,
        weekNumber: isNewTerm ? 1 : previousTerm.weekNumber + 1,
      };
      return acc;
    },
    {},
  );
});

const localComboBoxValue = computed((): ComboBoxOption | null => {
  if (!props.modelValue) {
    return null;
  }
  const dateTermInfo = dateToTermLookup.value[props.modelValue];
  if (!dateTermInfo) {
    return null;
  }

  return {
    id: props.modelValue,
    label: dateTermInfo.date,
    secondaryLabel: `${dateTermInfo.term} - Week ${dateTermInfo.weekNumber}`,
  };
});

const comboboxOptions = computed(() => {
  return startDateOptions.value.map((opt) => ({
    id: opt.date,
    label: opt.date,
    secondaryLabel: `${opt.term} - Week ${
      dateToTermLookup.value[opt.date].weekNumber
    }`,
  }));
});
</script>
<style scoped></style>
