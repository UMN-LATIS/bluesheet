<template>
  <div
    ref="dragDropWrapperRef"
    class="dragdrop tw-p-2 tw-min-h-[10rem] tw-w-full tw-rounded tw-relative"
    :class="{
      'dragdrop--is-droppable tw-bg-neutral-100': isTargetList,
      'tw-bg-neutral-50': !disabled && !isTargetList,
    }"
    @dragover.prevent
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <TransitionGroup name="fade">
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
  dragEnterCount.value = 0;
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
  // NOTE: we only clear the target list id only when it
  // matches this list's id, otherwise we could wind up with
  // a race condition where another component is setting the
  // new target list id BEFORE we clear the old target list id
  // leading to a null target list id
  // this seems worse in Safari, maybe because of laggier
  // dragenter/dragleave events?
  if (dragEnterCount.value === 0 && dragDropStore.targetListId === props.id) {
    dragDropStore.targetListId = null;
  }
}

const isTargetList = computed(() => {
  return dragDropStore.targetListId === props.id;
});

function handleDrop() {
  dragEnterCount.value = 0;

  if (!dragDropStore.activeItem) {
    throw new Error("No active item found");
  }

  if (!dragDropStore.sourceListId) {
    throw new Error("No source list id found");
  }

  if (!dragDropStore.targetListId) {
    throw new Error("No target list id found");
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
<style scoped></style>