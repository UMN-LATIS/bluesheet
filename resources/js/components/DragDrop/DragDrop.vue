<template>
  <div
    ref="dragDropWrapperRef"
    class="dragdrop tw-p-2 tw-min-h-[10rem] tw-w-full tw-rounded"
    :class="{
      'dragdrop--is-dragging tw-bg-neutral-200': isDroppable,
      'tw-bg-neutral-50': !isDroppable,
    }"
    @dragover.prevent
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div
      v-for="item in list"
      :key="item.id"
      :draggable="true"
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
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  useDragDropStore,
  type DragListId,
  type DragListItem,
} from "./useDragDropStore";

const props = defineProps<{
  id: DragListId;
  list: DragListItem[];
}>();

const dragDropStore = useDragDropStore();
const dragDropWrapperRef = ref<HTMLElement | null>(null);

onMounted(() => {
  dragDropStore.register(props.id, props.list);
});

const isDroppable = computed(() => {
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

  const sourceDragListId = dragDropStore.sourceListId;
  const draggedItemId = dragDropStore.activeItemId;
  const targetDragListId = dragDropStore.targetListId;

  if (!sourceDragListId || !draggedItemId || !targetDragListId) {
    throw new Error("Invalid drag and drop state");
  }

  dragDropStore.moveItem();
  dragEnterCount.value = 0;
}
</script>
<style lang="scss"></style>
