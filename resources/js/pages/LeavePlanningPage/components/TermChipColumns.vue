<template>
  <div
    v-for="band in bands"
    :key="band.term.id"
    class="tw-absolute tw-flex tw-flex-col tw-items-start tw-gap-1 tw-px-1.5"
    :style="{
      top: `${top}px`,
      left: `${band.left * 100}%`,
      width: `${band.width * 100}%`,
    }"
  >
    <SectionChip
      v-for="section in band.sections"
      :key="section.key"
      :section="section"
      :label="labelOf(section)"
      :isSelected="selectedSectionKey === section.key"
      @select="emit('selectSection', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TeachingSection } from "@/types";
import SectionChip from "./SectionChip.vue";
import type { TimelineAxis } from "../helpers/timelineAxis";

const props = defineProps<{
  axis: TimelineAxis;
  sectionsByTerm: Map<number, TeachingSection[]>;
  top: number;
  labelOf: (section: TeachingSection) => string;
  selectedSectionKey: string | null;
}>();

const emit = defineEmits<{ selectSection: [sectionKey: string] }>();

const bands = computed(() =>
  props.axis.terms
    .map((band) => ({
      ...band,
      sections: [...(props.sectionsByTerm.get(band.term.id) ?? [])].sort(
        (a, b) =>
          a.courseCode.localeCompare(b.courseCode) ||
          a.section.localeCompare(b.section),
      ),
    }))
    .filter(({ sections }) => sections.length > 0),
);
</script>
