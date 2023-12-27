<template>
  <div
    ref="dragDropWrapperRef"
    class="dragdrop tw-p-2 tw-min-h-[10rem] tw-w-full tw-rounded tw-relative"
    :class="{
      'dragdrop--is-droppable tw-bg-neutral-100': isDraggedOverDropZone,
      'tw-bg-neutral-50': !disabled && !isDraggedOverDropZone,
    }"
    @dragover.prevent
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <TransitionGroup name="list">
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
    </TransitionGroup>

    <slot name="footer" />
  </div>
</template>
<script setup lang="ts" generic="ItemType extends { id: string | number; }">
import { ref, computed } from "vue";
import { useDragDropStore } from "./useDragDropStore";
import type { DragListItem, DragListId, DropEvent } from "@/types";

const props = withDefaults(
  defineProps<{
    id: DragListId;
    group: string;
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

const dragDropStore = useDragDropStore<ItemType>(props.group);
const dragDropWrapperRef = ref<HTMLElement | null>(null);

const isDraggedOverDropZone = computed(() => {
  return dragDropStore.targetListId === props.id;
});

const isItemBeingDragged = computed(() => (item: DragListItem) => {
  return dragDropStore.activeItem?.id === item.id;
});

function handleDragStart(item: DragListItem, event: DragEvent) {
  dragDropStore.startDragging({
    sourceListId: props.id,
    item,
  });

  // maybe null if a mobile device?
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
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
    dragDropStore.targetListId = props.id;
  }
}

function handleDragLeave() {
  dragEnterCount.value--;

  // this is the last leave of the zone
  if (dragEnterCount.value === 0) {
    dragDropStore.targetListId = null;
  }
}

function handleDrop() {
  dragEnterCount.value = 0;

  if (
    !dragDropStore.activeItem ||
    !dragDropStore.sourceListId ||
    !dragDropStore.targetListId
  ) {
    throw new Error("No active item found");
  }

  // if we're dropping into the same list, do nothing
  if (dragDropStore.sourceListId === dragDropStore.targetListId) {
    return;
  }

  emit("drop", {
    item: dragDropStore.activeItem as ItemType,
    sourceListId: dragDropStore.sourceListId,
    targetListId: dragDropStore.targetListId,
  });
}
</script>
<style lang="scss">
.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
}
</style>
