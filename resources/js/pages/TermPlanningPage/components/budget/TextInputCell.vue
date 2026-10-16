<template>
  <input
    :value="value ?? ''"
    :disabled="!canEdit"
    :aria-label="label"
    placeholder="—"
    class="tw-h-full tw-min-h-10 tw-w-full tw-border-none tw-bg-transparent tw-px-2 tw-text-[11.5px] tw-text-on-surface tw-outline-none placeholder:tw-text-on-surface-variant focus:tw-bg-surface-bright disabled:tw-cursor-default"
    @change="onChange"
  />
</template>

<script setup lang="ts">
defineProps<{
  value: string | null;
  canEdit: boolean;
  label: string;
}>();

const emit = defineEmits<{ change: [value: string | null] }>();

function onChange(event: Event) {
  const text = (event.target as HTMLInputElement).value.trim();
  emit("change", text === "" ? null : text);
}
</script>
