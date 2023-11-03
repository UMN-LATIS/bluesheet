<template>
  <tr>
    <Th class="row-header-column">{{ label }}</Th>
    <Th
      v-for="term in terms"
      :id="`term-${term.id}`"
      :key="term.id"
      class="tw-whitespace-nowrap term-header-column"
      :class="{
        '!tw-bg-amber-100 !tw-border-amber-300 term-header-column--is-current-term':
          term.id === currentTerm?.id,
        'term-header-column--is-fall-term': term.name.includes('Fall'),
      }"
    >
      {{ term.name }}

      <Spinner
        v-if="termLoadStateMap.get(term.id) === 'loading'"
        class="tw-text-neutral-400 tw-h-4 tw-w-4"
      />
    </Th>
  </tr>
</template>
<script setup lang="ts">
import { Th } from "@/components/Table";
import { Term, LoadState } from "@/types";
import Spinner from "@/components/Spinner.vue";

defineProps<{
  label: string;
  terms: Term[];
  currentTerm: Term | null;
  termLoadStateMap: Map<Term["id"], LoadState>;
}>();
</script>
<style scoped></style>
