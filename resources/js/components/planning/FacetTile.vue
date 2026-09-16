<template>
  <button
    type="button"
    class="tw-relative tw-flex tw-min-h-14 tw-cursor-pointer tw-flex-col tw-items-start tw-gap-px tw-rounded-[10px] tw-border tw-border-solid tw-p-2 tw-px-3 tw-text-left"
    :class="
      isActive
        ? 'tw-border-primary tw-bg-primary-container'
        : 'tw-border-surface-container tw-bg-surface'
    "
    :aria-pressed="isActive"
  >
    <span
      v-if="checkedCount > 0"
      class="tw-absolute tw-right-1.5 tw-top-1.5 tw-rounded-full tw-bg-brand tw-px-1.5 tw-text-[10px] tw-font-semibold tw-leading-4 tw-text-white"
      :title="`${checkedCount} filters active`"
    >
      {{ checkedCount }}
    </span>
    <span
      class="tw-text-[21px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-on-surface"
      >{{ count }}&nbsp;<span
        v-if="count !== total"
        class="tw-text-[13px] tw-font-normal tw-text-on-surface-variant"
        >/&nbsp;{{ total }}</span
      ></span
    >
    <span
      class="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
    >
      {{ label }}
    </span>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    count: number;
    total: number;
    isActive: boolean;
    checkedCount?: number;
  }>(),
  { checkedCount: 0 },
);
</script>
