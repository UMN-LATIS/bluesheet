<template>
  <PostIt class="wide-layout__post-it">
    <slot />
  </PostIt>
</template>
<script setup lang="ts">
import { PostIt } from "@umn-latis/cla-vue-template";
</script>
<style>
.wide-layout__post-it {
  max-width: 90em;
  padding: 1rem;
  width: 100%;
  margin: auto;
}
.wide-layout__post-it .outer-container {
  max-width: 100% !important;
}
</style>
