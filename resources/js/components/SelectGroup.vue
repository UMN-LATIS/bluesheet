<template>
  <div class="form-group">
    <label v-if="label" :for="selectId">
      {{ label }}<span v-if="required" class="tw-text-red-600">*</span>
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      :required="required"
      class="form-control"
      :class="{
        'is-invalid': !isValid && isTouched,
        'is-valid': isValid && isTouched,
      }"
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
  }>(),
  {
    helpText: "",
    errorText: "",
    options: () => [],
    required: false,
    placeholder: "",
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
