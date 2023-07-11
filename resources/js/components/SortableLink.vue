<template>
  <span class="sortableLink" @click="$emit('sort', sortElement)"
    >{{ sortLabel }}
    <i
      class="fas"
      :class="{
        'fa-sort-alpha-up':
          currentSortDir == 'desc' && currentSort == sortElement,
        'fa-sort-alpha-down':
          currentSortDir == 'asc' && currentSort == sortElement,
      }"
    ></i>
  </span>
</template>

<script>
export default {
  props: ["sortLabel", "sortElement", "currentSort", "currentSortDir"],
};
</script>

<style>
.sortableLink {
  cursor: pointer;
  text-transform: capitalize;
}
</style>
