<template>
  <ul class="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-1.5 tw-p-0">
    <li v-for="section in sections" :key="section.sectionId">
      <SectionChip
        :label="section.label"
        :component="section.component"
        :title="section.title"
        :aria-label="`Open ${section.label}, ${section.title}`"
        @click="emit('select', section.sectionId)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import SectionChip from "../SectionChip.vue";
import type { SectionLink } from "../../helpers/peopleRows";

defineProps<{ sections: SectionLink[] }>();

const emit = defineEmits<{ select: [sectionId: number] }>();
</script>
