/**
 * Binds the pure editor to Vue: one piece of state, and one way in.
 *
 * This is the seam where effects will be run once the grid talks to the
 * server — the effect runner dispatches its results back through `dispatch`,
 * exactly as it does in the asset editor.
 */

import { ref } from "vue";
import { initialState, update } from "./update";
import type { EditorEvent } from "./types";

export function useScheduleEditor() {
  const state = ref(initialState());

  const dispatch = (event: EditorEvent) => {
    state.value = update(state.value, event);
  };

  return { state, dispatch };
}
