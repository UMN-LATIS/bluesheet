/** What the page has open, as URL query: a section's sheet, an hour's list, or both. */

import type { LocationQuery, LocationQueryValue } from "vue-router";
import { WEEKDAY_CODES } from "./scheduleDays";
import {
  clockFromMinutes,
  END_MINUTE,
  minutesFromClock,
  START_MINUTE,
} from "./timeScale";
import type { HourSelection, Selection } from "../useScheduleEditor/types";

/** Every key this module owns; they are cleared and written together. */
export const SELECTION_KEYS = ["section", "hour"];

/**
 * What a link can name. A grid block is left out: it stands for the section it
 * belongs to, which is what the sheet shows and what `section` restores.
 */
export type SheetSelection = Exclude<Selection, { kind: "meeting" }>;

export function encodeSelection(
  selection: Selection | null,
  sectionIdOfMeeting: (meetingId: string) => number | null,
): LocationQuery {
  if (!selection) return {};

  switch (selection.kind) {
    case "hour":
      return { hour: encodeHour(selection) };

    case "meeting": {
      // A time drawn on empty space belongs to no section, so it names nothing.
      const sectionId = sectionIdOfMeeting(selection.meetingId);
      return sectionId === null ? {} : { section: String(sectionId) };
    }

    case "section":
      return {
        section: String(selection.sectionId),
        // Both keys: the hour the sheet's back link returns to.
        ...(selection.from ? { hour: encodeHour(selection.from) } : {}),
      };
  }
}

export function decodeSelection(query: LocationQuery): SheetSelection | null {
  const hour = decodeHour(single(query.hour));
  const sectionId = decodeSectionId(single(query.section));

  if (sectionId === null) return hour;

  return { kind: "section", sectionId, ...(hour ? { from: hour } : {}) };
}

/** "tue-14:00": the day it sits under and the hour it begins. */
const encodeHour = (hour: HourSelection) =>
  `${WEEKDAY_CODES[hour.dayIndex]}-${clockFromMinutes(hour.startMinute)}`;

function decodeHour(raw: string | null): HourSelection | null {
  const [day, clock] = (raw ?? "").split("-");
  const dayIndex = WEEKDAY_CODES.findIndex((code) => code === day);
  if (dayIndex === -1 || !/^\d{1,2}:\d{2}$/.test(clock ?? "")) return null;

  const startMinute = minutesFromClock(clock);
  const isOnTheGrid = startMinute >= START_MINUTE && startMinute < END_MINUTE;

  return isOnTheGrid ? { kind: "hour", dayIndex, startMinute } : null;
}

function decodeSectionId(raw: string | null): number | null {
  const sectionId = Number(raw);
  return raw !== null && Number.isInteger(sectionId) && sectionId > 0
    ? sectionId
    : null;
}

/** A key repeated in the query arrives as an array; the first one wins. */
const single = (
  raw: LocationQueryValue | LocationQueryValue[] | undefined,
): string | null => (Array.isArray(raw) ? raw[0] : raw) ?? null;
