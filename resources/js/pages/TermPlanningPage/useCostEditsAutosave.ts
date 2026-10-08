import { debounce } from "lodash-es";
import { onScopeDispose, watch, type Ref } from "vue";
import { QUIET_PERIOD_MS } from "./useTermPlanAutosave";

/** Saves each cost edit once edits stop changing. */
export function useCostEditsAutosave<Edit>(options: {
  pendingEdits: Readonly<Ref<Record<string, Edit>>>;
  save: (key: string, edit: Edit) => Promise<unknown>;
  onSaved: (key: string, saved: Edit) => void;
  /** Called once per failed save. Nothing retries. */
  onRefused: (refusal: unknown) => void;
}) {
  const { pendingEdits, save, onSaved, onRefused } = options;
  const saveQueueByKey = new Map<string, Promise<void>>();

  const saveEditAt = (key: string): Promise<void> => {
    const saveLatestEdit = async () => {
      if (!(key in pendingEdits.value)) return;
      // Read the edit here, not when queued: an older
      // value would otherwise be saved after a newer one.
      const edit = pendingEdits.value[key];

      try {
        await save(key, edit);
        onSaved(key, edit);
      } catch (refusal) {
        onRefused(refusal);
      }
    };

    const previousSave = saveQueueByKey.get(key) ?? Promise.resolve();
    const queued = previousSave.then(saveLatestEdit);

    saveQueueByKey.set(key, queued);
    queued.finally(() => {
      if (saveQueueByKey.get(key) === queued) saveQueueByKey.delete(key);
    });

    return queued;
  };

  const saveEdited = () =>
    Promise.all(Object.keys(pendingEdits.value).map(saveEditAt));

  const flushSoon = debounce(saveEdited, QUIET_PERIOD_MS);

  watch(pendingEdits, (edits) => {
    if (Object.keys(edits).length > 0) flushSoon();
  });

  onScopeDispose(() => flushSoon.flush());

  return { flushSoon };
}
