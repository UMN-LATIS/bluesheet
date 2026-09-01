/**
 * Binds the pure editor to Vue: one piece of state, and one way in.
 *
 * A page owns the editor and hands it to the grid, so a toolbar, a sidebar
 * and a detail sheet can all read and change the same schedule without the
 * grid standing between them.
 *
 * This is the seam where effects will be run once the grid talks to the
 * server — the effect runner dispatches its results back through `dispatch`,
 * exactly as it does in the asset editor.
 */

import { type Ref, ref } from "vue";
import { initialState, update } from "./update";
import type { EditorEvent, EditorState } from "./types";

export interface ScheduleEditor {
  /** Read-only from outside: `dispatch` is the only way to change it. */
  state: Readonly<Ref<EditorState>>;
  dispatch: (event: EditorEvent) => void;
}

export function useScheduleEditor(): ScheduleEditor {
  const state = ref(initialState());

  const dispatch = (event: EditorEvent) => {
    state.value = update(state.value, event);
  };

  return { state, dispatch };
}
