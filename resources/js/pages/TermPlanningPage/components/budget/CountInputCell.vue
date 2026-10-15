<template>
  <span
    class="tw-relative tw-flex tw-h-full tw-min-w-0 tw-flex-col tw-justify-center"
  >
    <input
      type="text"
      inputmode="numeric"
      :value="count ?? ''"
      placeholder="—"
      :disabled="!canEdit"
      :aria-label="label"
      :aria-invalid="refusal !== null"
      class="tw-h-full tw-min-h-8 tw-w-full tw-min-w-0 tw-border-none tw-bg-transparent tw-px-2 tw-text-right tw-text-xs tw-font-semibold tw-tabular-nums tw-outline-none placeholder:tw-font-normal placeholder:tw-text-on-surface-variant focus:tw-bg-surface-bright focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary disabled:tw-cursor-default"
      :class="
        canEdit ? 'tw-text-primary hover:tw-bg-surface' : 'tw-text-on-surface'
      "
      @change="onChange"
    />
    <span
      v-if="refusal"
      role="alert"
      class="tw-px-2 tw-pb-1 tw-text-right tw-text-[11px] tw-text-brand"
    >
      {{ refusal }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  count: number | null;
  canEdit: boolean;
  label: string;
  min: number;
  max: number;
}>();

const emit = defineEmits<{ change: [count: number | null] }>();

const refusal = ref<string | null>(null);

watch(
  () => props.count,
  () => (refusal.value = null),
);

function onChange(event: Event) {
  const text = (event.target as HTMLInputElement).value.trim();
  const count = Number(text);

  if (
    text !== "" &&
    (!Number.isInteger(count) || count < props.min || count > props.max)
  ) {
    refusal.value = `${props.min}–${props.max}`;
    return;
  }

  refusal.value = null;
  emit("change", text === "" ? null : count);
}
</script>
