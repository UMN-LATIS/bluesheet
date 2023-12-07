<template>
  <SwitchGroup as="div" class="tw-flex tw-items-center">
    <SwitchLabel as="span" class="tw-whitespace-nowrap tw-mr-2 tw-text-sm">
      <slot />
    </SwitchLabel>
    <Switch
      :modelValue="modelValue"
      :class="[
        'tw-p-0',
        modelValue ? 'tw-bg-blue-600' : 'tw-bg-gray-200',
        'tw-relative tw-inline-flex tw-h-5 tw-w-10 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-600 focus:tw-ring-offset-2',
      ]"
      @update:modelValue="$emit('update:modelValue', $event)"
    >
      <span
        aria-hidden="true"
        :class="[
          modelValue ? 'tw-translate-x-5' : 'tw-translate-x-0',
          'tw-pointer-events-none tw-inline-block tw-h-4 tw-w-4 tw-transform tw-rounded-full tw-bg-white tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out',
        ]"
      />
    </Switch>
  </SwitchGroup>
</template>

<script setup lang="ts">
import { Switch, SwitchGroup, SwitchLabel } from "@headlessui/vue";

defineProps<{
  modelValue: boolean;
}>();

defineEmits<{
  (eventName: "update:modelValue", value: boolean): void;
}>();
</script>
