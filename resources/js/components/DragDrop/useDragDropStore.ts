import { defineStore } from "pinia";

export interface DragListItem {
  id: number | string;
  [key: string]: unknown;
}

export type DragListId = string | number;

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
      console.log("stopDragging");
      this.activeItemId = null;
      this.sourceListId = null;
      this.targetListId = null;
    },
    setTargetDragListId(targetDragListId: DragListId | null) {
      this.targetListId = targetDragListId;
    },
    moveItem() {
      if (
        !this.activeItemId ||
        !this.sourceListId ||
        !this.targetListId ||
        this.sourceItemIndex < 0
      ) {
        throw new Error("Invalid state");
      }

      const sourceList = this.dragLists[this.sourceListId];
      const targetList = this.dragLists[this.targetListId];

      // remove item from old list
      const item = sourceList.splice(this.sourceItemIndex, 1)[0];

      // add to new list
      targetList.push(item);
    },
  },
});
