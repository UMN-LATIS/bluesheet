<template>
  <AppHeader />
  <PostIt class="wide-layout__post-it">
    <slot />
  </PostIt>
  <AppFooter />
</template>
<script setup lang="ts">
import { AppFooter, PostIt } from "@umn-latis/cla-vue-template";
import AppHeader from "@/components/AppHeader.vue";
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
