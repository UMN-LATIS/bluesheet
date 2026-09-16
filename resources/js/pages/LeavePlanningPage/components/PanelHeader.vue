<template>
  <div
    class="tw-flex-none tw-border-0 tw-border-b tw-border-solid tw-border-outline-variant tw-px-[18px] tw-pb-3 tw-pt-3.5"
  >
    <div class="tw-flex tw-items-center tw-gap-2">
      <slot name="tags" />
      <button
        type="button"
        aria-label="Close"
        class="tw-ml-auto tw-flex tw-h-11 tw-w-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-xl tw-leading-none tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
        @click="emit('close')"
      >
        ×
      </button>
    </div>

    <h2 class="tw-m-0 tw-mt-0.5 tw-text-[19px] tw-font-bold tw-tracking-tight">
      {{ title }}
    </h2>
    <p
      v-if="subtitle"
      class="tw-m-0 tw-truncate tw-text-[13px] tw-text-on-surface-variant"
      :title="subtitle"
    >
      {{ subtitle }}
    </p>
    <p
      v-if="metaLine"
      class="tw-m-0 tw-mt-1.5 tw-text-[11px] tw-text-on-surface-variant"
    >
      {{ metaLine }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
  metaLine: string;
}>();

const emit = defineEmits<{ close: [] }>();
</script>
