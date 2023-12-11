declare module "vuedraggable" {
  export interface DraggableAddedEvent<T> {
    added: {
      element: T;
      newIndex: number;
    };
  }

  export interface DraggableRemovedEvent<T> {
    removed: {
      element: T;
      oldIndex: number;
    };
  }

  export type DraggableChangeEvent<T> =
    | DraggableAddedEvent<T>
    | DraggableRemovedEvent<T>;
}
