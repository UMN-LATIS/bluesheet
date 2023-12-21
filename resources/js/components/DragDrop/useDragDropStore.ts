import { defineStore } from "pinia";
import { DragListItem, DragListId } from "@/types";

export const useDragDropStore = defineStore("dragDrop", {
  state: () => ({
    dragLists: {} as Record<DragListId, DragListItem[]>,
    activeItemId: null as DragListItem["id"] | null,
    sourceListId: null as DragListId | null,
    targetListId: null as DragListId | null,
  }),
  getters: {
    isDragging(state): boolean {
      return state.activeItemId !== null;
    },
    sourceItemIndex(state): number {
      if (!state.activeItemId || !state.sourceListId) {
        return -1;
      }

      const sourceList = state.dragLists[state.sourceListId];
      return sourceList.findIndex((item) => item.id === state.activeItemId);
    },
    activeItem(state): DragListItem | null {
      if (!state.activeItemId || !state.sourceListId) {
        return null;
      }

      const sourceList = state.dragLists[state.sourceListId];
      return sourceList.find((item) => item.id === state.activeItemId) || null;
    },
  },
  actions: {
    register(listId: DragListId, list: DragListItem[]) {
      this.dragLists[listId] = list;
    },
    startDragging({
      itemId,
      listId,
    }: {
      itemId: DragListItem["id"];
      listId: DragListId;
    }) {
      this.activeItemId = itemId;
      this.sourceListId = listId;
      this.targetListId = listId;
    },
    stopDragging() {
      this.activeItemId = null;
      this.sourceListId = null;
      this.targetListId = null;
    },
    setTargetDragListId(targetDragListId: DragListId | null) {
      this.targetListId = targetDragListId;
    },
    moveActiveItem({
      item,
      sourceListId,
      targetListId,
    }: {
      item: DragListItem;
      sourceListId: DragListId;
      targetListId: DragListId;
    }) {
      const sourceList = this.dragLists[sourceListId];
      const targetList = this.dragLists[targetListId];

      const sourceItemIndex = sourceList.findIndex(
        (listItem) => item.id === listItem.id,
      );

      // remove item from old list
      sourceList.splice(sourceItemIndex, 1)[0];

      // add to new list
      targetList.push(item);
    },
  },
});
