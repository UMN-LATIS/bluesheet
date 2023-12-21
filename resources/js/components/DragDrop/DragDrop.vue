<template>
  <div
    ref="dragDropWrapperRef"
    class="dragdrop tw-p-2 tw-min-h-[10rem] tw-w-full tw-rounded"
    :class="{
      'dragdrop--is-droppable tw-bg-neutral-100': isDraggedOverDropZone,
      'tw-bg-neutral-50': !disabled && !isDraggedOverDropZone,
    }"
    @dragover.prevent
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div
      v-for="item in list"
      :key="item.id"
      :draggable="!disabled"
      class="dragdrop-listitem tw-cursor-move"
      :class="{
        'dragdrop-listitem--is-dragging tw-opacity-50':
          isItemBeingDragged(item),
      }"
      @dragstart="handleDragStart(item, $event)"
      @dragend="handleDragEnd"
    >
      <slot name="item" :element="item" />
    </div>

    <slot name="footer" />
  </div>
</template>
<script setup lang="ts" generic="ItemType extends DragListItem">
import { ref, onMounted, computed } from "vue";
import { useDragDropStore } from "./useDragDropStore";
import type { DragListItem, DragListId, DropEvent } from "@/types";

const props = withDefaults(
  defineProps<{
    id: DragListId;
    list: ItemType[];
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  (eventName: "drop", componentEvent: DropEvent<ItemType>): void;
}>();

const dragDropStore = useDragDropStore();
const dragDropWrapperRef = ref<HTMLElement | null>(null);

onMounted(() => {
  dragDropStore.register(props.id, props.list);
});

const isDraggedOverDropZone = computed(() => {
  return dragDropStore.targetListId === props.id;
});

function isItemBeingDragged(item: DragListItem) {
  return (
    dragDropStore.sourceListId === props.id &&
    dragDropStore.activeItemId === item.id
  );
}

function handleDragStart(item: DragListItem, event: DragEvent) {
  dragDropStore.startDragging({
    listId: props.id,
    itemId: item.id,
  });

  if (!event.dataTransfer) {
    // maybe a mobile device?
    console.warn("event.dataTransfer is null");
    return;
  }

  event.dataTransfer.effectAllowed = "move";
}

function handleDragEnd() {
  dragDropStore.stopDragging();
}

// drag and drop child elements will also
// trigger dragenter and dragleave events. So we
// need to track enters/exits to know when to
// it's a new enter or an complete leave of the zone
const dragEnterCount = ref(0);
function handleDragEnter() {
  dragEnterCount.value++;

  // this is the first enter into the zone
  if (dragEnterCount.value === 1) {
    dragDropStore.setTargetDragListId(props.id);
  }
}

function handleDragLeave() {
  dragEnterCount.value--;

  // this is the last leave of the zone
  if (dragEnterCount.value === 0) {
    dragDropStore.setTargetDragListId(null);
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault();

  if (!event.dataTransfer) {
    // maybe a mobile device?
    console.warn("event.dataTransfer is null");
    return;
  }

  const activeItem = dragDropStore.activeItem as ItemType;
  if (
    !activeItem ||
    !dragDropStore.sourceListId ||
    !dragDropStore.targetListId
  ) {
    throw new Error("No active item found");
  }

  const dropEvent: DropEvent<ItemType> = {
    item: activeItem,
    sourceListId: dragDropStore.sourceListId,
    targetListId: dragDropStore.targetListId,
  };

  emit("drop", dropEvent);

  dragDropStore.moveActiveItem(dropEvent);
  dragEnterCount.value = 0;
}
</script>
<style lang="scss"></style>
