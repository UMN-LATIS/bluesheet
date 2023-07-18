<template>
  <select
    :id="id"
    class="nested-select"
    :value="modelValue"
    @change="
      $emit('update:modelValue', ($event.target as HTMLSelectElement).value)
    "
  >
    <option v-if="isNullable" value="">&ndash;</option>
    <option v-else value="" disabled>Select...</option>
    <option
      v-for="option in flattenedOptions"
      :key="option.id"
      :value="option.id"
    >
      {{ option.label }}
    </option>
  </select>
</template>
<script setup lang="ts">
import { computed } from "vue";

export interface OptionNode {
  id: number | string;
  parent_id: number | string | null;
  label: string;
  children: OptionNode[];
}

const props = withDefaults(
  defineProps<{
    id?: string;
    options: OptionNode[];
    modelValue: number | string | null; // id of selected option
    isNullable?: boolean;
  }>(),
  {
    id: `nested-select-${new Date().getTime().toString()}`,
    isNullable: false,
  },
);

defineEmits<{
  (event: "update:modelValue", optionId: number | string | null): void;
}>();

// flattening the options
const flattenOptions = (
  options: OptionNode[],
  depth = 0,
  parentFullPath = "",
) => {
  return options.reduce((acc: OptionNode[], option) => {
    const fullPath = parentFullPath
      ? `${parentFullPath} > ${option.label}`
      : option.label;
    const hyphenPrefix = "-".repeat(depth);
    const newOption = {
      ...option,
      fullPath,
      label: `${hyphenPrefix} ${option.label}`,
    };
    const children = option.children
      ? flattenOptions(option.children, depth + 1, fullPath)
      : [];

    return [...acc, newOption, ...children];
  }, []);
};

const flattenedOptions = computed(() => flattenOptions(props.options));
</script>
<style scoped>
select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  appearance: none; /* This will remove the default select style */
  /* replace with a chevron icon */
  background-image: url("data:image/svg+xml, %3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%23111' %3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E");
  background-position: right 0.33rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  padding-right: 1.5rem;
  border-color: #ced4da;
  border-radius: 0.25rem;
}

option:disabled {
  color: #999;
}
</style>
