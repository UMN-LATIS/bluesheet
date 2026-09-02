import { describe, expect, it } from "vitest";
import { decodeSelection, encodeSelection } from "./selectionQuery";
import type { HourSelection } from "../useScheduleEditor/types";

const noSection = () => null;

const hour: HourSelection = { kind: "hour", dayIndex: 1, startMinute: 840 };

describe("encodeSelection", () => {
  it("writes nothing when nothing is selected", () => {
    expect(encodeSelection(null, noSection)).toEqual({});
  });

  it("round-trips a section", () => {
    const selection = { kind: "section", sectionId: 412 } as const;

    expect(decodeSelection(encodeSelection(selection, noSection))).toEqual(
      selection,
    );
  });

  it("round-trips an hour", () => {
    expect(encodeSelection(hour, noSection)).toEqual({ hour: "tue-14:00" });
    expect(decodeSelection({ hour: "tue-14:00" })).toEqual(hour);
  });

  it("round-trips the hour a section was opened from", () => {
    const selection = { kind: "section", sectionId: 412, from: hour } as const;

    expect(decodeSelection(encodeSelection(selection, noSection))).toEqual(
      selection,
    );
  });

  it("names the section a selected grid block belongs to", () => {
    const selection = { kind: "meeting", meetingId: "412-mon-10:10" } as const;

    expect(encodeSelection(selection, () => 412)).toEqual({ section: "412" });
  });

  it("writes nothing for a block belonging to no section", () => {
    const selection = { kind: "meeting", meetingId: "local-1" } as const;

    expect(encodeSelection(selection, noSection)).toEqual({});
  });
});

describe("decodeSelection", () => {
  it("selects nothing from an empty query", () => {
    expect(decodeSelection({})).toBeNull();
  });

  it("ignores a section id that is not one", () => {
    expect(decodeSelection({ section: "abc" })).toBeNull();
    expect(decodeSelection({ section: "1.5" })).toBeNull();
    expect(decodeSelection({ section: "-3" })).toBeNull();
  });

  it("ignores an hour off the grid or misspelled", () => {
    expect(decodeSelection({ hour: "sun-14:00" })).toBeNull();
    expect(decodeSelection({ hour: "tue-23:00" })).toBeNull();
    expect(decodeSelection({ hour: "tue" })).toBeNull();
  });

  it("keeps the section when its hour cannot be read", () => {
    expect(decodeSelection({ section: "412", hour: "nope" })).toEqual({
      kind: "section",
      sectionId: 412,
    });
  });
});
