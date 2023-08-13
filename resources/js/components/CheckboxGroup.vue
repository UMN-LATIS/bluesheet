<template>
  <div class="tw-relative tw-flex tw-items-start">
    <div class="tw-flex tw-h-6 tw-items-center">
      <input
        :id="id"
        :aria-describedby="description ? `${id}-description` : undefined"
        :name="name"
        type="checkbox"
        class="tw-h-4 tw-w-4 tw-rounded tw-border-neutral-300 tw-text-indigo-600 focus:tw-ring-indigo-600"
        :checked="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
    </div>
    <div class="tw-ml-3 tw-text-sm tw-leading-6">
      <label :for="id" class="tw-font-semibold tw-text-neutral-900 tw-m-0">
        {{ label }}
      </label>
      <p
        v-if="description"
        :id="`${id}-description`"
        class="tw-text-neutral-500 tw-text-sm"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  id: string;
  name?: string;
  description?: string;
  label: string;
  modelValue: boolean;
}>();

defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();
</script>
<style scoped></style>
