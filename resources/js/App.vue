<template>
  <div>
    <RouterView :key="$route.fullPath" />
    <ErrorModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useUserStore } from "@/stores/useUserStore";
import ErrorModal from "@/components/ErrorModal.vue";

const userStore = useUserStore();

onMounted(() => {
  userStore.init();
});
</script>

<style>
.navbar-block .router-link-exact-active {
  color: black !important;
}

.fas {
  margin-left: 5px;
  margin-top: 3px;
}
</style>
<style scoped>
.post-it {
  position: relative;
  z-index: 1;
  margin-bottom: 2rem;
}
</style>
<style lang="scss">
.umn-app-header .navbar-links-container {
  justify-content: space-between;
  width: 100%;
  & .navbar-item:not(:first-child, :last-child) {
    flex: 1;
    display: inline-flex;
    justify-content: center;
  }
}
</style>
