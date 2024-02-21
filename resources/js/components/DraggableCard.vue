<template>
  <div
    class="tw-bg-white tw-py-2 tw-flex tw-gap-1 tw-items-top tw-italic tw-rounded tw-border tw-border-neutral-400"
    :class="{
      'tw-cursor-move tw-shadow': isDraggable,
      'tw-cursor-default tw-px-2': !isDraggable,
    }"
  >
    <DragHandleIcon v-if="isDraggable" class="tw-inline-block" />
    <div class="tw-flex-1 tw-overflow-hidden">
      <slot />
    </div>
    <MoreMenu v-if="isEditable" class="tw-not-italic">
      <MoreMenuItem
        class="tw-flex tw-gap-2 tw-items-center"
        @click="$emit('click:edit')"
      >
        Edit
      </MoreMenuItem>
      <MoreMenuItem class="tw-text-red-600" @click="$emit('click:remove')">
        Remove
      </MoreMenuItem>
    </MoreMenu>
  </div>
</template>
<script setup lang="ts">
import { DragHandleIcon } from "@/icons";
import { MoreMenu, MoreMenuItem } from "@/components/MoreMenu";

withDefaults(
  defineProps<{
    isDraggable?: boolean;
    isEditable?: boolean;
  }>(),
  {
    isDraggable: false,
    isEditable: false,
  },
);

defineEmits<{
  (eventName: "click:edit"): void;
  (eventName: "click:remove"): void;
}>();
</script>
<style scoped></style>
