<template>
  <div
    class="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-error tw-bg-surface tw-p-3"
  >
    <p class="tw-m-0 tw-text-[13px] tw-text-on-surface">
      <slot />
    </p>
    <div class="tw-flex tw-justify-end tw-gap-2">
      <Button variant="secondary" @click="emit('cancel')">Keep it</Button>
      <Button variant="danger" @click="emit('confirm')">
        {{ confirmLabel }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/Button.vue";

withDefaults(defineProps<{ confirmLabel?: string }>(), {
  confirmLabel: "Delete",
});

const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>
