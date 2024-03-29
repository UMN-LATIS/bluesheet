import { computed, reactive, toRefs, UnwrapRef } from "vue";
import { defineStore } from "pinia";
import { DragDropMeta, DragListId } from "@/types";
interface DragDropState<ItemType> {
  activeItem: ItemType | null;
  sourceListId: DragListId | null;
  targetListId: DragListId | null;
  listMeta: Record<DragListId, DragDropMeta>;
}

const groupStores = new Map<string, ReturnType<typeof useDragDropStore>>();

// wrap defineStore with a function so that we can use a generic item type
// and namespace dragdrop stores
export const useDragDropStore = <ItemType>(groupName: string) => {
  if (groupStores.has(groupName)) {
    const store = groupStores.get(groupName);
    return store();
  }

  const store = defineStore(`${groupName}-dragDrop`, () => {
    const state = reactive<DragDropState<ItemType>>({
      activeItem: null as ItemType | null,
      sourceListId: null as DragListId | null,
      targetListId: null as DragListId | null,
      listMeta: {},
    });

    const getters = {
      isDragging: computed((): boolean => {
        return state.activeItem !== null;
      }),
    };

    const actions = {
      startDragging({
        item,
        sourceListId,
      }: {
        item: ItemType;
        sourceListId: DragListId;
      }) {
        state.activeItem = item as UnwrapRef<ItemType>;
        state.sourceListId = sourceListId;
        state.targetListId = sourceListId;
      },
      stopDragging() {
        state.activeItem = null;
        state.sourceListId = null;
        state.targetListId = null;
      },
      setListMeta(listId: DragListId, meta: DragDropMeta) {
        state.listMeta[listId] = meta;
      },
      getListMeta: (listId: DragListId): DragDropMeta =>
        state.listMeta[listId] ?? {},
    };

    return {
      ...toRefs(state),
      ...getters,
      ...actions,
    };
  });

  groupStores.set(groupName, store);
  return store();
};
