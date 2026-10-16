<template>
  <button
    type="button"
    class="tw-flex tw-cursor-pointer tw-items-center tw-gap-[7px] tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-border-l-[3px] tw-py-[3px] tw-pl-3 tw-pr-[5px] tw-text-[11px] tw-leading-tight tw-text-on-surface hover:tw-border-outline disabled:tw-cursor-default disabled:hover:tw-border-outline-variant"
    :class="[
      color.tint,
      color.rail,
      isSelected && [
        'tw-outline tw-outline-2 tw-outline-offset-0',
        isReadOnly ? 'tw-outline-on-surface' : 'tw-outline-primary',
      ],
      isCancelled && 'tw-opacity-60',
      isUnofficial && 'tw-border-dashed',
    ]"
    :aria-pressed="isSelected"
  >
    <span class="tw-min-w-0 tw-truncate tw-font-semibold">{{ label }}</span>
    <span
      class="tw-flex-none tw-text-[9px] tw-font-bold tw-tracking-[0.07em] tw-text-on-surface-variant"
    >
      {{ component }}
    </span>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { colorOfTypeInTerm } from "@/utils/meetingTypeColors";

const props = withDefaults(
  defineProps<{
    label: string;
    component: string;
    isSelected?: boolean;
    isCancelled?: boolean;
    isUnofficial?: boolean;
    isReadOnly?: boolean;
  }>(),
  {
    isSelected: false,
    isCancelled: false,
    isUnofficial: false,
    isReadOnly: false,
  },
);

const color = computed(() =>
  colorOfTypeInTerm(props.component, props.isReadOnly),
);
</script>
