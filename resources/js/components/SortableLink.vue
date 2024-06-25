<template>
  <button class="sortableLink" @click="$emit('sort', sortElement)">
    {{ sortLabel }}
    <i
      class="fas"
      :class="{
        'fa-sort-alpha-up': currentSortDir == 'desc' && isCurrentSort,
        'fa-sort-alpha-down': currentSortDir == 'asc' && isCurrentSort,
        'fa-sort tw-text-neutral-300': !isCurrentSort,
      }"
    ></i>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  sortLabel: string;
  // this sort element name
  sortElement: string;
  // the current sort element for a given table
  currentSort: string;

  currentSortDir: "asc" | "desc";
}>();

defineEmits<{
  (eventName: "sort", value: string): void;
}>();

const isCurrentSort = computed(() => {
  return props.currentSort === props.sortElement;
});
</script>

<style>
.sortableLink {
  cursor: pointer;
  text-transform: capitalize;
  border: none;
  background-color: transparent;
  color: inherit;
  padding: 0;
  margin: 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
}
</style>
