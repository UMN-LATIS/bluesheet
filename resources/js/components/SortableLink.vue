<template>
  <span @click="$emit('sort', sortElement)" class="sortableLink"
    >{{ sortLabel }}
    <i
      class="fas"
      v-bind:class="{
        'fa-sort-alpha-up':
          currentSortDir == 'desc' && currentSort == sortElement,
        'fa-sort-alpha-down':
          currentSortDir == 'asc' && currentSort == sortElement,
      }"
    ></i>
  </span>
</template>

<style>
.sortableLink {
  cursor: pointer;
  text-transform: capitalize;
}
</style>

<script>
export default {
  props: ["sortLabel", "sortElement", "currentSort", "currentSortDir"],
};
</script>
