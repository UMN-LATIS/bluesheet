<template>
  <label
    class="tw-m-0 tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2.5 tw-rounded-lg tw-px-2.5 tw-py-1 tw-text-[12.5px] tw-font-normal tw-text-on-surface hover:tw-bg-surface"
    :class="{ 'tw-bg-surface': isGroupHeading }"
  >
    <input
      type="checkbox"
      class="tw-h-4 tw-w-4 tw-flex-none tw-rounded tw-border-outline tw-text-brand focus:tw-ring-brand"
      :checked="isChecked"
      :indeterminate="isIndeterminate"
      @change="emit('toggle', ($event.target as HTMLInputElement).checked)"
    />
    <span
      v-if="swatch"
      aria-hidden="true"
      class="tw-h-2.5 tw-w-2.5 tw-flex-none tw-rounded-[3px]"
      :class="swatch"
    />
    <span class="tw-min-w-0 tw-flex-1">
      <span
        class="tw-block tw-truncate"
        :class="{
          'tw-font-bold tw-uppercase tw-tracking-[0.07em]': isGroupHeading,
          'tw-pl-3': isIndented,
        }"
      >
        <slot />
      </span>
      <span
        v-if="$slots.secondary"
        class="tw-block tw-truncate tw-text-[11px] tw-text-on-surface-variant"
      >
        <slot name="secondary" />
      </span>
    </span>
    <span
      class="tw-flex-none tw-text-[11px] tw-tabular-nums tw-text-on-surface-variant"
    >
      <slot name="annotation" />
    </span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  isChecked: boolean;
  isIndeterminate?: boolean;
  /** A course-level row that bulk-toggles every course under it. */
  isGroupHeading?: boolean;
  /** Nudges the primary text in, so it reads as nested under a heading row. */
  isIndented?: boolean;
  /** A Tailwind bg class for a color square, e.g. from colorOfType(code).dot. */
  swatch?: string;
}>();

const emit = defineEmits<{ toggle: [isChecked: boolean] }>();
</script>
