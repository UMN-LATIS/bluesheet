import type { UrlQuery } from "@/utils/urlQuery";
import { sectionIdOfMeetingId } from "./sectionPlacement";
import { WEEKDAY_CODES } from "./scheduleDays";
import {
  clockFromMinutes,
  END_MINUTE,
  minutesFromClock,
  START_MINUTE,
} from "./timeScale";
import type { HourSelection, Selection } from "../useScheduleEditor/types";

/**
 * Every key this module owns; they are cleared and written together.
 * `sectionId` rather than `section`: that name is already a filter facet, and
 * a sheet opened on a section must not also check it in the filters.
 */
export const SELECTION_KEYS = ["sectionId", "hour", "leaveId"];

/**
 * What a link can name. A grid block is left out: it stands for the section it
 * belongs to, which is what the sheet shows and what `sectionId` restores.
 */
export type SheetSelection = Exclude<Selection, { kind: "meeting" }>;

export function encodeSelection(selection: Selection | null): UrlQuery {
  if (!selection) return {};

  switch (selection.kind) {
    case "hour":
      return { hour: encodeHour(selection) };

    case "meeting": {
      // A section being created has a negative id and no row
      // to link to, so its block names nothing. See
      // `decodePositiveId`.
      const sectionId = sectionIdOfMeetingId(selection.meetingId);
      return sectionId === null || sectionId < 1
        ? {}
        : { sectionId: String(sectionId) };
    }

    case "section":
      return {
        sectionId: String(selection.sectionId),
        // Both keys: the hour the sheet's back link returns to.
        ...(selection.from ? { hour: encodeHour(selection.from) } : {}),
      };

    case "leave":
      return { leaveId: String(selection.leaveId) };
  }
}

export function decodeSelection(query: UrlQuery): SheetSelection | null {
  const hour = decodeHour(query.hour);
  const sectionId = decodePositiveId(query.sectionId);

  if (sectionId !== null) {
    return { kind: "section", sectionId, ...(hour ? { from: hour } : {}) };
  }

  const leaveId = decodePositiveId(query.leaveId);
  if (leaveId !== null) return { kind: "leave", leaveId };

  return hour;
}

/** "tue-14:00": the day it sits under and the hour it begins. */
const encodeHour = (hour: HourSelection) =>
  `${WEEKDAY_CODES[hour.dayIndex]}-${clockFromMinutes(hour.startMinute)}`;

function decodeHour(raw: string | undefined): HourSelection | null {
  const [day, clock] = (raw ?? "").split("-");
  const dayIndex = WEEKDAY_CODES.findIndex((code) => code === day);
  if (dayIndex === -1 || !/^\d{1,2}:\d{2}$/.test(clock ?? "")) return null;

  const startMinute = minutesFromClock(clock);
  const isOnTheGrid = startMinute >= START_MINUTE && startMinute < END_MINUTE;

  return isOnTheGrid ? { kind: "hour", dayIndex, startMinute } : null;
}

function decodePositiveId(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const id = Number(raw);
  const isPositiveInteger = Number.isInteger(id) && id > 0;
  return isPositiveInteger ? id : null;
}
