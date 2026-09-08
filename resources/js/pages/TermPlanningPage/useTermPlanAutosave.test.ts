import { describe, expect, it } from "vitest";
import { isEqual } from "lodash-es";
import { effectScope, ref } from "vue";
import { useTermPlanAutosave } from "./useTermPlanAutosave";
import type { SectionEdit } from "./useScheduleEditor/types";
import type { PlannedSection } from "./types";

const sectionNamed = (title: string) => ({ id: 1, title }) as PlannedSection;

/** Lets every queued promise run, the way the pause between edits would. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A request the test decides when to answer. */
function heldRequest() {
  let answer!: () => void;
  const promise = new Promise<void>((resolve) => {
    answer = resolve;
  });

  return { promise, answer: () => answer() };
}

/**
 * One section under autosave, with the first save held open and the rest
 * answered at once, which is the shape every race here starts from.
 */
function oneSlowSaveThenFast() {
  const held = heldRequest();
  const sent: string[] = [];
  const refused: unknown[] = [];
  const sections = ref([sectionNamed("first")]);
  const pendingEdits = ref<Record<number, SectionEdit>>({});

  const scope = effectScope();
  const autosave = scope.run(() =>
    useTermPlanAutosave({
      sections,
      pendingEdits,
      save: (section: PlannedSection) => {
        sent.push(section.title);
        return sent.length === 1 ? held.promise : Promise.resolve();
      },
      // mirrors `sectionEditsPersisted`: the overlay only goes when it is
      // still the edit that was saved, so a newer one survives its flight
      onSaved: (sectionId, saved) => {
        if (isEqual(pendingEdits.value[sectionId], saved)) {
          delete pendingEdits.value[sectionId];
        }
      },
      onRefused: (refusal) => refused.push(refusal),
    }),
  )!;

  /** An edit, sent without waiting out the pause. */
  const edit = (title: string) => {
    pendingEdits.value = { 1: { title } };
    sections.value = [sectionNamed(title)];
    autosave.flushSoon();
    return autosave.flushSoon.flush() as unknown as Promise<unknown>;
  };

  return { edit, sent, held, refused };
}

describe("useTermPlanAutosave", () => {
  it("holds a section's next save until the one in flight is back", async () => {
    const { edit, sent, held } = oneSlowSaveThenFast();

    const first = edit("first");
    await settle();
    expect(sent).toEqual(["first"]);

    const second = edit("second");
    await settle();

    // Still only the one. Two PUTs of the same section in flight together can
    // come back out of order, and "first" landing last restores what
    // "second" replaced.
    expect(sent).toEqual(["first"]);

    held.answer();
    await Promise.all([first, second]);

    expect(sent).toEqual(["first", "second"]);
  });

  it("sends the section as it stands when its turn comes", async () => {
    const { edit, sent, held } = oneSlowSaveThenFast();

    const first = edit("first");
    await settle();
    const second = edit("second");
    await settle();
    const third = edit("third");
    await settle();

    held.answer();
    await Promise.all([first, second, third]);

    // "second" was overtaken while it waited, so it is never sent on its own
    expect(sent).toEqual(["first", "third"]);
  });

  it("a refused save does not block the next one", async () => {
    const sent: string[] = [];
    const refused: unknown[] = [];
    const pendingEdits = ref<Record<number, SectionEdit>>({});
    const sections = ref([sectionNamed("first")]);

    const scope = effectScope();
    const autosave = scope.run(() =>
      useTermPlanAutosave({
        sections,
        pendingEdits,
        save: (section: PlannedSection) => {
          sent.push(section.title);
          return sent.length === 1
            ? Promise.reject(new Error("422"))
            : Promise.resolve();
        },
        // mirrors `sectionEditsPersisted`: the overlay only goes when it is
        // still the edit that was saved, so a newer one survives its flight
        onSaved: (sectionId, saved) => {
          if (isEqual(pendingEdits.value[sectionId], saved)) {
            delete pendingEdits.value[sectionId];
          }
        },
        onRefused: (refusal) => refused.push(refusal),
      }),
    )!;

    const edit = (title: string) => {
      pendingEdits.value = { 1: { title } };
      sections.value = [sectionNamed(title)];
      autosave.flushSoon();
      return autosave.flushSoon.flush() as unknown as Promise<unknown>;
    };

    await edit("first");
    await settle();
    await edit("second");
    await settle();

    expect(sent).toEqual(["first", "second"]);
    expect(refused).toHaveLength(1);
  });
});
