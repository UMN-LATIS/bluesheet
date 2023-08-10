<template>
  <div class="form-group">
    <label v-if="label" :for="inputId">
      {{ label }}<span v-if="required" class="tw-text-red-600">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      class="form-control"
      :class="{
        'is-invalid': !isValid && isTouched,
        'is-valid': isValid && isTouched,
      }"
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
  }>(),
  {
    helpText: "",
    errorText: "",
    type: "text",
    placeholder: "",
    required: false,
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
