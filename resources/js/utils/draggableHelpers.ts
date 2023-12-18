import {
  DraggableChangeEvent,
  DraggableAddedEvent,
  DraggableRemovedEvent,
} from "vuedraggable";

export function isDraggableAddedEvent<T>(
  event: DraggableChangeEvent<T>,
): event is DraggableAddedEvent<T> {
  return "added" in event;
}

export function isDraggableRemovedEvent<T>(
  event: DraggableChangeEvent<T>,
): event is DraggableRemovedEvent<T> {
  return "removed" in event;
}

export function getElementFromDraggableEvent<U>(
  event: DraggableChangeEvent<U>,
): U {
  if (isDraggableAddedEvent(event)) {
    return event.added.element;
  }
  if (isDraggableRemovedEvent(event)) {
    return event.removed.element;
  }

  throw new Error("Invalid event");
}
