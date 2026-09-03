import { debounce } from "lodash-es";
import { onScopeDispose, watch, type Ref } from "vue";
import type { SectionEdit } from "./useScheduleEditor/types";
import type { PlannedSection } from "./types";

/**
 * A pause in typing counts as a blur.
 *
 * Long enough that a name typed letter by letter is one save, short enough
 * that a scheduler who closes the tab straight after a change still keeps it.
 */
const QUIET_PERIOD_MS = 800;

/**
 * Sends edits to the server once the scheduler stops making them.
 *
 * The editor holds each change as a sparse overlay on the section it belongs
 * to. This watches those overlays, and when they settle sends the whole
 * section for each one and tells the editor which edits it can let go of. An
 * overlay stays put until its own save lands, so a failed save leaves the
 * change on screen rather than losing it silently.
 */
export function useTermPlanAutosave(options: {
  sections: Readonly<Ref<PlannedSection[]>>;
  pendingEdits: Readonly<Ref<Record<number, SectionEdit>>>;
  save: (section: PlannedSection) => Promise<unknown>;
  onSaved: (sectionId: number, saved: SectionEdit) => void;
}) {
  const { sections, pendingEdits, save, onSaved } = options;

  const saveEdited = async () => {
    // read once: an edit made during a save must not be marked as saved
    const edits = { ...pendingEdits.value };

    await Promise.all(
      Object.entries(edits).map(async ([id, edit]) => {
        const sectionId = Number(id);
        const section = sections.value.find(({ id }) => id === sectionId);
        if (!section) return;

        await save(section);
        onSaved(sectionId, edit);
      }),
    );
  };

  const flushSoon = debounce(saveEdited, QUIET_PERIOD_MS);

  watch(pendingEdits, (edits) => {
    if (Object.keys(edits).length > 0) flushSoon();
  });

  // a page left mid-pause would otherwise drop the last change
  onScopeDispose(() => flushSoon.flush());

  return { flushSoon };
}
