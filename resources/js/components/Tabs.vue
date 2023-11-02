<template>
  <div>
    <div class="tw-hidden sm:tw-block">
      <nav class="tw-flex tw-space-x-4" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.name"
          :class="[
            tab.current
              ? 'tw-bg-blue-100 tw-text-blue-700'
              : 'tw-bg-transparent  tw-text-gray-500 hover:tw-text-gray-700',
            'tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-border-none',
          ]"
          :aria-current="tab.current ? 'page' : undefined"
          @click="$emit('change', tab)"
        >
          {{ tab.name }}
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface Tab {
  id: string;
  name: string;
  current: boolean;
}

defineProps<{
  tabs: Tab[];
}>();

defineEmits<{
  (eventName: "change", tab: Tab);
}>();
</script>
