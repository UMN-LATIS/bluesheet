<template>
  <tr>
    <Th class="row-header-column">{{ label }}</Th>
    <Th
      v-for="term in terms"
      v-show="coursePlanningStore.isTermVisible(term.id)"
      :id="`term-${term.id}`"
      :key="term.id"
      class="tw-whitespace-nowrap term-header-column"
      :class="{
        '!tw-bg-amber-100 !tw-border-amber-300 term-header-column--is-current-term':
          coursePlanningStore.termsStore.isCurrentTerm(term.id),
        'term-header-column--is-fall-term': term.name.includes('Fall'),
      }"
    >
      {{ term.name }}
    </Th>
  </tr>
</template>
<script setup lang="ts">
import { Th } from "@/components/Table";
import { computed } from "vue";
import { useCoursePlanningStore } from "../stores/useCoursePlanningStore";

defineProps<{
  label: string;
}>();

const coursePlanningStore = useCoursePlanningStore();
const terms = computed(() => coursePlanningStore.termsStore.terms);
</script>
<style scoped></style>
