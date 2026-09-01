import type { Meeting } from "../types";
import type { EditorState } from "./types";

/**
 * The schedule as the user sees it: the server's meetings with the local
 * edits laid over them, plus the meetings drawn here.
 *
 * An override whose meeting has left the base — the section lost that time
 * slot on a refetch — no longer has anything to apply to, so it is ignored
 * rather than resurrected.
 */
export function mergeSchedule(base: Meeting[], state: EditorState): Meeting[] {
  return [
    ...base.map((meeting) => {
      const override = state.overrides[meeting.id];
      return override ? { ...meeting, ...override } : meeting;
    }),
    ...state.drawn,
  ];
}
