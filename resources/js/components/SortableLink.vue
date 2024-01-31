<template>
  <span class="sortableLink" @click="$emit('sort', sortElement)"
    >{{ sortLabel }}
    <i
      class="fas"
      :class="{
        'fa-sort-alpha-up': currentSortDir == 'desc' && isCurrentSort,
        'fa-sort-alpha-down': currentSortDir == 'asc' && isCurrentSort,
      }"
    ></i>
  </span>
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
}
</style>
