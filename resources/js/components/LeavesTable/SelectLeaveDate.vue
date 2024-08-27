<template>
  <div class="tw-flex">
    <ComboBox
      v-if="!showCustomDateInput"
      :modelValue="localComboBoxValue"
      :label="variant === 'start' ? 'Leave Start Date' : 'Leave End Date'"
      :showLabel="false"
      :options="comboboxOptions"
      class="tw-w-36"
      @update:modelValue="
        (comboboxOption) =>
          $emit('update:modelValue', comboboxOption?.id as string)
      "
    />
    <InputGroup
      v-else
      label="Custom Leave Start Date"
      type="date"
      :modelValue="modelValue"
      :showLabel="false"
      class="tw-w-36"
      @update:modelValue="$emit('update:modelValue', $event)"
    />
    <button
      class="tw-bg-transparent tw-border-none"
      @click="showCustomDateInput = !showCustomDateInput"
    >
      <VDotsIcon />
      <span class="sr-only">Choose from available leave dates</span>
    </button>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ComboBox, { ComboBoxOption } from "@/components/ComboBox.vue";
import InputGroup from "../InputGroup.vue";
import { VDotsIcon } from "@/icons";
import { useUserStore } from "@/stores/useUserStore";
import { DateWithTermAndWeekNum, ISODate } from "@/types";
import dayjs from "dayjs";

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

const showCustomDateInput = ref(false);
const userStore = useUserStore();
const { leaveStartDateLookup, leaveEndDateLookup } = userStore;
const currentLookupVariant = computed(() =>
  props.variant === "start" ? leaveStartDateLookup : leaveEndDateLookup,
);

function toComboBoxOption(
  dateTermInfo: DateWithTermAndWeekNum,
): ComboBoxOption {
  return {
    id: dateTermInfo.date,
    label: dayjs(dateTermInfo.date).format("MM/DD/YYYY"),
    secondaryLabel: dateTermInfo.term
      ? `${dateTermInfo.term} - Week ${dateTermInfo.weekNumber}`
      : "-",
  };
}

const localComboBoxValue = computed((): ComboBoxOption | null => {
  if (!props.modelValue) {
    return null;
  }
  const dateTermInfo = currentLookupVariant.value[props.modelValue];
  if (!dateTermInfo) {
    return null;
  }

  return toComboBoxOption(dateTermInfo);
});

const comboboxOptions = computed(() =>
  Object.values(currentLookupVariant.value).map(toComboBoxOption),
);
</script>
<style scoped></style>
