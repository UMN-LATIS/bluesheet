/**
 * Turns the sections the server returned into the meetings the grid draws,
 * and keeps the way back: each placed meeting's id looks up its section, so
 * a block can be labeled without the grid ever learning what a section is.
 */

import type { Meeting, SisDay, SisSection } from "../types";
import { END_MINUTE, minutesFromClock, START_MINUTE } from "./timeScale";

/** The days the grid has columns for, in column order. */
const GRID_DAYS: SisDay[] = ["mon", "tue", "wed", "thu", "fri"];

export interface PlacedSections {
  meetings: Meeting[];
  sectionsByMeetingId: Map<string, SisSection>;
  /** Sections with no meeting time, which the tray lists instead. */
  unscheduled: SisSection[];
  /**
   * Meetings the grid has no room for: weekend days, or times outside its
   * hours. The page says so when this is not zero, so a missing block reads
   * as a known gap rather than a bug.
   */
  outsideGridCount: number;
}

export function placeSections(sections: SisSection[]): PlacedSections {
  const meetings: Meeting[] = [];
  const sectionsByMeetingId = new Map<string, SisSection>();
  const unscheduled: SisSection[] = [];
  let outsideGridCount = 0;

  for (const section of sections) {
    // A crosslisted class is one block, drawn by its primary; the partner
    // sections are the same class under another number.
    if (section.crosslist && !section.crosslist.isPrimary) continue;

    if (section.meetings.length === 0) {
      unscheduled.push(section);
      continue;
    }

    section.meetings.forEach((pattern, patternIndex) => {
      const startMinute = minutesFromClock(pattern.startTime);
      const endMinute = minutesFromClock(pattern.endTime);
      const fitsHours = START_MINUTE <= startMinute && endMinute <= END_MINUTE;

      for (const day of pattern.days) {
        const dayIndex = GRID_DAYS.indexOf(day);
        if (dayIndex === -1 || !fitsHours) {
          outsideGridCount += 1;
          continue;
        }

        // Stable across refetches, so local overrides keyed by it survive.
        const id = `s${section.id}:${patternIndex}:${day}`;

        meetings.push({ id, dayIndex, startMinute, endMinute });
        sectionsByMeetingId.set(id, section);
      }
    });
  }

  return {
    meetings,
    sectionsByMeetingId,
    unscheduled,
    outsideGridCount,
  };
}
