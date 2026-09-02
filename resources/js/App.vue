<template>
  <div>
    <RouterView />
    <Teleport to="body">
      <ErrorModal />
    </Teleport>
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
.fas {
  margin-left: 5px;
  margin-top: 3px;
}
</style>
