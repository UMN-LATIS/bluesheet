<template>
  <div
    v-for="termColumn in termColumns"
    :key="termColumn.term.termCode"
    class="tw-absolute tw-flex tw-flex-col tw-items-start tw-gap-1 tw-px-1.5"
    :style="{
      top: `${top}px`,
      left: `${termColumn.left * 100}%`,
      width: `${termColumn.width * 100}%`,
    }"
  >
    <SectionChip
      v-for="section in termColumn.sections"
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

const byCourseThenSection = (a: TeachingSection, b: TeachingSection) =>
  a.courseCode.localeCompare(b.courseCode) ||
  a.section.localeCompare(b.section);

const termColumns = computed(() =>
  props.axis.terms
    .map((axisTerm) => {
      const sections = props.sectionsByTerm.get(axisTerm.term.termCode) ?? [];
      return { ...axisTerm, sections: [...sections].sort(byCourseThenSection) };
    })
    .filter(({ sections }) => sections.length > 0),
);
</script>
