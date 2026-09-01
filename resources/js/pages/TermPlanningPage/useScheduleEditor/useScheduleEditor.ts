/**
 * Binds the pure editor to Vue: one piece of state, and one way in.
 *
 * A page owns the editor and hands it to the grid, so a toolbar, a sidebar
 * and a detail sheet can all read and change the same schedule without the
 * grid standing between them.
 *
 * The base is the server's schedule, owned by the query cache and passed in
 * as a ref. The editor state holds only what this browser changed, so a
 * refetch replaces the base without disturbing the user's edits.
 *
 * Effects run here, right after the state they came from is stored, through
 * the `runEffect` the page supplies. The page owns the router and, later,
 * the API client, so it is the one that knows what an effect means. An
 * effect's outcome comes back through `dispatch` like any other event,
 * exactly as in the asset editor.
 */

import { type Ref, ref } from "vue";
import type { Meeting } from "../types";
import { initialState, update } from "./update";
import type { EditorEvent, EditorState, Effect } from "./types";

export interface ScheduleEditor {
  /** Read-only from outside: `dispatch` is the only way to change it. */
  state: Readonly<Ref<EditorState>>;
  /** The server's meetings, which the local edits lay over. */
  base: Readonly<Ref<Meeting[]>>;
  dispatch: (event: EditorEvent) => void;
}

export function useScheduleEditor(
  base: Readonly<Ref<Meeting[]>>,
  runEffect: (effect: Effect) => void,
): ScheduleEditor {
  const state = ref(initialState());

  const dispatch = (event: EditorEvent) => {
    const step = update(state.value, event, base.value);
    state.value = step.state;
    step.effects.forEach(runEffect);
  };

  return { state, base, dispatch };
}
