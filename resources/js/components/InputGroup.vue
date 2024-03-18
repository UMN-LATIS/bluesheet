<template>
  <div class="form-group tw-mb-0">
    <Label
      :for="inputId"
      :required="required"
      :class="[
        {
          'sr-only': !showLabel,
        },
        labelClass,
      ]"
    >
      {{ label }}
    </Label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      class="form-control tw-text-sm tw-bg-transparent tw-border placeholder:tw-text-neutral-400 placeholder:tw-italic"
      :class="[
        {
          'is-invalid': !isValidComputed,
        },
        inputClass,
      ]"
      :required="required"
      @input="updateValue"
    />
    <small v-if="helpText" class="form-text text-muted">{{ helpText }}</small>
    <div v-if="!isValidComputed && errorText" class="invalid-feedback">
      {{ errorText }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { CSSClass } from "@/types";
import Label from "./Label.vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    helpText?: string;
    isValid?: boolean;
    validator?: (value: unknown) => boolean;
    validateWhenUntouched?: boolean;
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
    isValid: undefined,
    validator: () => true,
    validateWhenUntouched: false,
  },
);

const emits = defineEmits(["update:modelValue"]);

const inputId = `input-${Math.random().toString(36).substring(7)}`;
const isTouched = ref(false);
const isValidComputed = computed(() => {
  if (!props.validateWhenUntouched && !isTouched.value) {
    return true;
  }

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
  const newValue = (event.target as HTMLInputElement).value;
  emits("update:modelValue", newValue);
};
</script>
