<template>
  <div class="form-group tw-mb-0">
    <label
      :for="selectId"
      class="tw-uppercase tw-text-neutral-500 tw-font-semibold tw-text-xs tw-tracking-wider tw-mb-2 tw-block"
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
          'is-invalid': isValidComputed === false && isTouched,
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
    <div v-if="isValidComputed === false && isTouched" class="invalid-feedback">
      {{ errorText || `Invalid ${label}` }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { CSSClass } from "@/types";

export interface OptionType {
  value: string | number;
  text: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number;
    label: string;
    options: OptionType[];
    helpText?: string;
    isValid?: boolean;
    validator?: (value: unknown) => boolean;
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
    isValid: undefined,
    validator: () => true,
  },
);

const emits = defineEmits(["update:modelValue"]);

const selectId = `select-${Math.random().toString(36).substring(7)}`;
const isTouched = ref(false);
const isValidComputed = computed(() => {
  if (props.isValid !== undefined) {
    return props.isValid;
  }

  if (props.validator) {
    return props.validator(props.modelValue);
  }

  if (props.required) {
    return props.modelValue !== "";
  }

  return true;
});

const updateValue = (event: Event) => {
  isTouched.value = true;
  const newValue = (event.target as HTMLSelectElement).value;
  emits("update:modelValue", newValue);
};
</script>
