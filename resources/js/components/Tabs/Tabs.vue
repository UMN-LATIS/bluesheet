<template>
  <div>
    <div class="tabs tw-flex" :class="labelsClass">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="[
          `tab-button tab-button--${tab.id} tw-px-4 tw-py-2 tw-text-sm tw-border-b-2`,
          {
            'tw-border-transparent text-neutral-400': tab.id !== activeTabId,
            'tab-button--is-active border-neutral-900 text-neutral-900 tw-font-bold':
              tab.id === activeTabId,
          },
        ]"
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tw-py-4">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, provide } from "vue";
import { TabsInjectionKey } from "./constants";

export interface TabsContext {
  addTab: (tab: Tab) => void;
  removeTab: (tab: Tab) => void;
  setActiveTab: (id: string) => void;
  isActiveTab: (id: string) => boolean;
  initialTabId?: string;
}

export interface Tab {
  id: string;
  label: string;
}

const props = defineProps<{
  labelsClass?: string;
  activeTabId: string;
}>();

const emit = defineEmits<{
  (event: "tabChange", tab: Tab): void;
}>();

const tabs = ref<Tab[]>([]);

const addTab = (tab: Tab) => {
  tabs.value.push(tab);
};

const removeTab = (tab: Tab) => {
  const index = tabs.value.findIndex((t) => t.id === tab.id);
  if (index === -1) return;
  tabs.value.splice(index, 1);
};

const setActiveTab = (tabId: string) => {
  const newActiveTab = tabs.value.find((t) => t.id === tabId);
  if (!newActiveTab) {
    throw new Error(`Tab with id ${tabId} not found`);
  }
  emit("tabChange", newActiveTab);
};

const isActiveTab = (tabId: string) => {
  return tabId === props.activeTabId;
};

provide<TabsContext>(TabsInjectionKey, {
  addTab,
  removeTab,
  setActiveTab,
  isActiveTab,
});
</script>

<style scoped></style>
