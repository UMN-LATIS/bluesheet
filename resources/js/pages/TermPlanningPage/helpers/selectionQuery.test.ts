import { describe, expect, it } from "vitest";
import { decodeSelection, encodeSelection } from "./selectionQuery";
import type { HourSelection } from "../useScheduleEditor/types";
import type { Meeting } from "../types";

/** No block belongs to a section, so a block selection names nothing. */
const noMeetings: Meeting[] = [];

const meetingOf412: Meeting[] = [
  {
    id: "412-mon-10:10",
    dayIndex: 0,
    sectionId: 412,
    startMinute: 610,
    endMinute: 660,
  },
];

const hour: HourSelection = { kind: "hour", dayIndex: 1, startMinute: 840 };

describe("encodeSelection", () => {
  it("writes nothing when nothing is selected", () => {
    expect(encodeSelection(null, noMeetings)).toEqual({});
  });

  it("round-trips a section", () => {
    const selection = { kind: "section", sectionId: 412 } as const;

    expect(decodeSelection(encodeSelection(selection, noMeetings))).toEqual(
      selection,
    );
  });

  it("round-trips an hour", () => {
    expect(encodeSelection(hour, noMeetings)).toEqual({ hour: "tue-14:00" });
    expect(decodeSelection({ hour: "tue-14:00" })).toEqual(hour);
  });

  it("round-trips the hour a section was opened from", () => {
    const selection = { kind: "section", sectionId: 412, from: hour } as const;

    expect(decodeSelection(encodeSelection(selection, noMeetings))).toEqual(
      selection,
    );
  });

  it("names the section a selected grid block belongs to", () => {
    const selection = { kind: "meeting", meetingId: "412-mon-10:10" } as const;

    expect(encodeSelection(selection, meetingOf412)).toEqual({
      sectionId: "412",
    });
  });

  it("writes nothing for a block belonging to no section", () => {
    const selection = { kind: "meeting", meetingId: "local-1" } as const;

    expect(encodeSelection(selection, noMeetings)).toEqual({});
  });
});

describe("decodeSelection", () => {
  it("selects nothing from an empty query", () => {
    expect(decodeSelection({})).toBeNull();
  });

  it("ignores a section id that is not one", () => {
    expect(decodeSelection({ sectionId: "abc" })).toBeNull();
    expect(decodeSelection({ sectionId: "1.5" })).toBeNull();
    expect(decodeSelection({ sectionId: "-3" })).toBeNull();
  });

  // `section` is a filter facet, and checking a section in the filters must
  // not open its sheet.
  it("ignores the section filter's own key", () => {
    expect(decodeSelection({ section: "PSY 1001 · 001" })).toBeNull();
  });

  it("ignores an hour off the grid or misspelled", () => {
    expect(decodeSelection({ hour: "sun-14:00" })).toBeNull();
    expect(decodeSelection({ hour: "tue-23:00" })).toBeNull();
    expect(decodeSelection({ hour: "tue" })).toBeNull();
  });

  it("keeps the section when its hour cannot be read", () => {
    expect(decodeSelection({ sectionId: "412", hour: "nope" })).toEqual({
      kind: "section",
      sectionId: 412,
    });
  });
});
