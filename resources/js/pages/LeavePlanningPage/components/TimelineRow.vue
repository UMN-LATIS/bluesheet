<template>
  <div
    class="tw-flex tw-border-0 tw-border-b tw-border-solid tw-border-surface-container"
    :style="{
      width: 'calc(var(--lp-name) + var(--lp-track) + var(--lp-trailing))',
      minHeight: `${height}px`,
    }"
  >
    <div
      class="tw-sticky tw-left-0 tw-z-10 tw-flex tw-flex-none tw-flex-col tw-justify-center tw-gap-px tw-border-0 tw-border-r tw-border-solid tw-border-surface-container tw-bg-surface-bright tw-px-3.5 tw-py-2"
      :style="{ width: 'var(--lp-name)' }"
    >
      <span class="tw-truncate tw-text-[13px] tw-font-semibold">{{
        name
      }}</span>
      <span
        v-if="detail"
        class="tw-truncate tw-text-[11px] tw-text-on-surface-variant"
        :title="detail"
      >
        {{ detail }}
      </span>
    </div>
    <div class="tw-relative tw-flex-none" :style="{ width: 'var(--lp-track)' }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
  detail: string | null;
  height: number;
}>();
</script>
