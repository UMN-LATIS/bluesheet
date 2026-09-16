<template>
  <button
    type="button"
    :data-selection-key="`section-${section.key}`"
    :title="`${section.subject} ${section.catalogNumber} · ${section.section} · ${section.title}`"
    :aria-pressed="isSelected"
    class="tw-inline-flex tw-h-[22px] tw-max-w-full tw-flex-none tw-cursor-pointer tw-items-center tw-gap-1.5 tw-overflow-hidden tw-whitespace-nowrap tw-rounded-md tw-pl-1.5 tw-pr-2 tw-text-[11px] tw-leading-none tw-text-on-surface"
    :class="[
      colors.tint,
      colors.rail,
      section.isPlanned ? 'tw-border-outline' : 'tw-border-transparent',
      { 'tw-ring-2 tw-ring-primary': isSelected },
    ]"
    :style="{
      borderStyle: section.isPlanned ? 'dashed' : 'solid',
      borderWidth: '1px',
      borderLeftWidth: '3px',
      borderLeftStyle: 'solid',
      scrollMarginTop: 'calc(var(--lp-header) + 8px)',
      scrollMarginLeft: 'calc(var(--lp-name) + 12px)',
      scrollMarginRight: 'calc(var(--lp-trailing) + 12px)',
    }"
    @click="emit('select', section.key)"
  >
    <span class="tw-truncate tw-font-semibold">{{ label }}</span>
    <span class="tw-flex-none tw-text-on-surface-variant">{{
      section.section
    }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TeachingSection } from "@/types";
import { colorOfType } from "@/utils/meetingTypeColors";

const props = defineProps<{
  section: TeachingSection;
  label: string;
  isSelected: boolean;
}>();

const emit = defineEmits<{ select: [sectionKey: string] }>();

const colors = computed(() => colorOfType(props.section.component));
</script>
