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
 * overlay stays put until its own save is back from the server, so a refused
 * save leaves the change on screen and the next edit sends it again.
 */
export function useTermPlanAutosave(options: {
  sections: Readonly<Ref<PlannedSection[]>>;
  pendingEdits: Readonly<Ref<Record<number, SectionEdit>>>;
  save: (section: PlannedSection) => Promise<unknown>;
  onSaved: (sectionId: number, saved: SectionEdit) => void;
  /** Nothing here retries, so this is the reader's only sign of a refusal. */
  onRefused: (refusal: unknown) => void;
}) {
  const { sections, pendingEdits, save, onSaved, onRefused } = options;

  /**
   * The save each section is waiting behind. One section's saves run in a
   * line, so a slow first request cannot land after a later one and put the
   * older values back.
   */
  const saving = new Map<number, Promise<void>>();

  const saveSection = (sectionId: number): Promise<void> => {
    const queued = (saving.get(sectionId) ?? Promise.resolve()).then(
      async () => {
        // Read when this link runs rather than when it was queued: what goes
        // to the server is the section as it stands now, and an edit the
        // save ahead already covered is gone from the overlay by here.
        const edit = pendingEdits.value[sectionId];
        const section = sections.value.find(({ id }) => id === sectionId);
        if (!edit || !section) return;

        // one section per catch, so a refusal on one still saves the rest
        try {
          await save(section);
          onSaved(sectionId, edit);
        } catch (refusal) {
          onRefused(refusal);
        }
      },
    );

    saving.set(sectionId, queued);
    queued.finally(() => {
      if (saving.get(sectionId) === queued) saving.delete(sectionId);
    });

    return queued;
  };

  const saveEdited = () =>
    Promise.all(Object.keys(pendingEdits.value).map(Number).map(saveSection));

  const flushSoon = debounce(saveEdited, QUIET_PERIOD_MS);

  watch(pendingEdits, (edits) => {
    if (Object.keys(edits).length > 0) flushSoon();
  });

  // a page left mid-pause would otherwise drop the last change
  onScopeDispose(() => flushSoon.flush());

  return { flushSoon };
}
