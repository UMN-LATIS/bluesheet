import { debounce } from "lodash-es";
import { onScopeDispose, watch, type Ref } from "vue";
import { QUIET_PERIOD_MS } from "./useTermPlanAutosave";

/** Saves each cost edit once edits stop changing. */
export function useCostEditsAutosave<Edit>(options: {
  pendingEdits: Readonly<Ref<Record<string, Edit>>>;
  save: (edit: Edit) => Promise<unknown>;
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
        await save(edit);
        onSaved(key, edit);
      } catch (refusal) {
        onRefused(refusal);
      }
    };

    const previousSave = saveQueueByKey.get(key) ?? Promise.resolve();
    const queuedSave = previousSave.then(saveLatestEdit);

    saveQueueByKey.set(key, queuedSave);
    queuedSave.finally(() => {
      if (saveQueueByKey.get(key) === queuedSave) saveQueueByKey.delete(key);
    });

    return queuedSave;
  };

  const saveAllPendingEdits = () =>
    Promise.all(Object.keys(pendingEdits.value).map(saveEditAt));

  const flushSoon = debounce(saveAllPendingEdits, QUIET_PERIOD_MS);

  watch(pendingEdits, (edits) => {
    if (Object.keys(edits).length > 0) flushSoon();
  });

  onScopeDispose(() => flushSoon.flush());

  return { flushSoon };
}
