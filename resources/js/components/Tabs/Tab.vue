<template>
  <div v-show="tabsContext?.isActiveTab(id)" role="tabpanel">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { inject, onMounted, onUnmounted } from "vue";
import { TabsInjectionKey } from "./constants";
import type { TabsContext } from "./Tabs.vue";

const props = defineProps<{
  id: string;
  label: string;
}>();

const tabsContext = inject<TabsContext>(TabsInjectionKey);

onMounted(() => {
  if (!tabsContext) {
    throw new Error("TabsContext not found");
  }
  tabsContext.addTab(props);
});

onUnmounted(() => {
  if (!tabsContext) {
    throw new Error("TabsContext not found");
  }
  tabsContext.removeTab(props);
});
</script>
