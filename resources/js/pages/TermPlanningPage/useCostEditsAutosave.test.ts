import { describe, expect, it } from "vitest";
import { effectScope, ref } from "vue";
import { useCostEditsAutosave } from "./useCostEditsAutosave";

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function heldRequest() {
  let answer!: () => void;
  const promise = new Promise<void>((resolve) => {
    answer = resolve;
  });

  return { promise, answer: () => answer() };
}

type Edit = number | null;

function costEditsUnderAutosave(
  save: (key: string, edit: Edit) => Promise<unknown> = () => Promise.resolve(),
) {
  const pendingEdits = ref<Record<string, Edit>>({});
  const sent: [string, Edit][] = [];
  const saved: [string, Edit][] = [];
  const refused: unknown[] = [];

  const scope = effectScope();
  const autosave = scope.run(() =>
    useCostEditsAutosave<Edit>({
      pendingEdits,
      save: (key, edit) => {
        sent.push([key, edit]);
        return save(key, edit);
      },
      onSaved: (key, edit) => saved.push([key, edit]),
      onRefused: (refusal) => refused.push(refusal),
    }),
  )!;

  const flush = () => autosave.flushSoon.flush() as unknown as Promise<unknown>;

  return { pendingEdits, sent, saved, refused, scope, autosave, flush };
}

describe("useCostEditsAutosave", () => {
  it("saves each pending key once after the quiet period and reports it saved", async () => {
    const { pendingEdits, sent, saved, autosave } = costEditsUnderAutosave();

    pendingEdits.value = { a: 1, b: 2 };
    await settle();
    expect(sent).toEqual([]);

    await autosave.flushSoon.flush();
    await settle();

    expect(sent).toEqual([["a", 1], ["b", 2]]);
    expect(saved).toEqual([["a", 1], ["b", 2]]);
  });

  it("saves a null edit, since null clears the setting", async () => {
    const { pendingEdits, sent, saved, flush } = costEditsUnderAutosave();

    pendingEdits.value = { a: null };
    await settle();
    await flush();
    await settle();

    expect(sent).toEqual([["a", null]]);
    expect(saved).toEqual([["a", null]]);
  });

  it("sends the newer value in a second save once the first is back", async () => {
    const held = heldRequest();
    const { pendingEdits, sent, saved, flush } = costEditsUnderAutosave(
      (_key, edit) => (edit === 1 ? held.promise : Promise.resolve()),
    );

    pendingEdits.value = { a: 1 };
    await settle();
    const first = flush();
    await settle();
    expect(sent).toEqual([["a", 1]]);

    pendingEdits.value = { a: 2 };
    await settle();
    const second = flush();
    await settle();
    expect(sent).toEqual([["a", 1]]);

    held.answer();
    await Promise.all([first, second]);

    expect(sent).toEqual([["a", 1], ["a", 2]]);
    expect(saved).toEqual([["a", 1], ["a", 2]]);
  });

  it("calls onRefused and not onSaved when a save is refused", async () => {
    const refusal = new Error("422");
    const { pendingEdits, saved, refused, flush } = costEditsUnderAutosave(() =>
      Promise.reject(refusal),
    );

    pendingEdits.value = { a: 1 };
    await settle();
    await flush();
    await settle();

    expect(refused).toEqual([refusal]);
    expect(saved).toEqual([]);
  });

  it("flushes a pending save when the scope is disposed", async () => {
    const { pendingEdits, sent, scope } = costEditsUnderAutosave();

    pendingEdits.value = { a: 1 };
    await settle();
    expect(sent).toEqual([]);

    scope.stop();
    await settle();

    expect(sent).toEqual([["a", 1]]);
  });
});
