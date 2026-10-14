<template>
  <div class="tw-flex tw-flex-wrap tw-gap-x-2.5 tw-gap-y-0.5">
    <button
      v-for="section in sections"
      :key="section.sectionId"
      type="button"
      class="tw-cursor-pointer tw-whitespace-nowrap tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-text-primary hover:tw-underline"
      :aria-label="`Open ${section.label}`"
      @click="emit('select', section.sectionId)"
    >
      {{ section.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SectionLink } from "../../helpers/peopleRows";

defineProps<{ sections: SectionLink[] }>();

const emit = defineEmits<{ select: [sectionId: number] }>();
</script>
