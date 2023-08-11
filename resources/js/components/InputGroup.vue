<template>
  <div class="form-group">
    <label
      :for="inputId"
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
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      class="form-control"
      :class="[
        {
          'is-invalid': !isValid && isTouched,
          'is-valid': isValid && isTouched,
        },
        inputClass,
      ]"
      :required="required"
      @input="updateValue"
    />
    <small v-if="helpText" class="form-text text-muted">{{ helpText }}</small>
    <div v-if="!isValid && isTouched" class="invalid-feedback">
      {{ errorText || `Invalid ${label}` }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { CSSClass } from "@/types";

withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    helpText?: string;
    isValid?: boolean;
    type?: string;
    placeholder?: string;
    errorText?: string;
    required?: boolean;
    showLabel?: boolean;
    labelClass?: CSSClass;
    inputClass?: CSSClass;
  }>(),
  {
    helpText: "",
    errorText: "",
    type: "text",
    placeholder: "",
    required: false,
    showLabel: true,
  },
);

const emits = defineEmits(["update:modelValue"]);

const inputId = `input-${Math.random().toString(36).substring(7)}`;
const isTouched = ref(false);

const updateValue = (event: Event) => {
  isTouched.value = true;
  const newValue = (event.target as HTMLInputElement).value;
  emits("update:modelValue", newValue);
};
</script>
