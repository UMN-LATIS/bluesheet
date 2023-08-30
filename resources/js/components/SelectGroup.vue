<template>
  <div class="form-group tw-mb-0">
    <label
      :for="selectId"
      class="tw-uppercase tw-text-neutral-500 tw-font-bold tw-text-xs tw-tracking-wider tw-mb-1 tw-block"
      :class="[
        {
          'sr-only': !showLabel,
        },
        labelClass,
      ]"
    >
      {{ label }}
      <span v-if="required" class="tw-text-red-600">*</span>
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      :required="required"
      class="form-control tw-text-sm tw-bg-transparent"
      :class="[
        {
          'is-invalid': !isValid && isTouched,
        },
        selectClass,
      ]"
      @change="updateValue"
    >
      <option v-if="required" value="" disabled>
        {{ placeholder || "Select an option" }}
      </option>

      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.text }}
      </option>
    </select>
    <small v-if="helpText" class="form-text text-muted">{{ helpText }}</small>
    <div v-if="!isValid && isTouched" class="invalid-feedback">
      {{ errorText || `Invalid ${label}` }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { CSSClass } from "@/types";

interface OptionType {
  value: string;
  text: string;
}

withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    helpText?: string;
    isValid?: boolean;
    options: OptionType[];
    errorText?: string;
    required?: boolean;
    placeholder?: string;
    showLabel?: boolean;
    selectClass?: CSSClass;
    labelClass?: CSSClass;
  }>(),
  {
    helpText: "",
    errorText: "",
    options: () => [],
    required: false,
    placeholder: "",
    showLabel: true,
  },
);

const emits = defineEmits(["update:modelValue"]);

const selectId = `select-${Math.random().toString(36).substring(7)}`;
const isTouched = ref(false);

const updateValue = (event: Event) => {
  isTouched.value = true;
  const newValue = (event.target as HTMLSelectElement).value;
  emits("update:modelValue", newValue);
};
</script>
