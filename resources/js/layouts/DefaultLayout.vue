<template>
  <AppHeader />
  <PostIt class="container-fluid post-it">
    <slot />
  </PostIt>
  <AppFooter />
</template>
<script setup lang="ts">
import { PostIt } from "@umn-latis/cla-vue-template";
import { AppFooter } from "@umn-latis/cla-vue-template";
import AppHeader from "@/components/AppHeader.vue";
</script>
<style scoped></style>
