<template>
  <ul class="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1.5 tw-p-0">
    <li
      v-for="section in sections"
      :key="section.sectionId"
      class="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-0.5"
    >
      <SectionChip
        :label="section.label"
        :component="section.component"
        :aria-label="`Open ${section.label}`"
        @click="emit('select', section.sectionId)"
      />
      <CellSubline class="tw-max-w-full" :title="section.title">
        {{ section.title }}
      </CellSubline>
    </li>
  </ul>
</template>

<script setup lang="ts">
import SectionChip from "../SectionChip.vue";
import CellSubline from "./CellSubline.vue";
import type { SectionLink } from "../../helpers/peopleRows";

defineProps<{ sections: SectionLink[] }>();

const emit = defineEmits<{ select: [sectionId: number] }>();
</script>
