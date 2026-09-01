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
  /** Blocks on the grid. */
  shownCount: number;
  /**
   * Shown plus everything the grid cannot draw yet: weekend meetings, times
   * outside its hours, and sections with no set time (one each). The header
   * prints both, so missing data reads as a known gap rather than a bug.
   */
  totalCount: number;
}

export function placeSections(sections: SisSection[]): PlacedSections {
  const meetings: Meeting[] = [];
  const sectionsByMeetingId = new Map<string, SisSection>();
  let hiddenCount = 0;

  for (const section of sections) {
    // A crosslisted class is one block, drawn by its primary; the partner
    // sections are the same class under another number.
    if (section.crosslist && !section.crosslist.isPrimary) continue;

    // Bound for the no-set-time tray, in a later slice.
    if (section.meetings.length === 0) {
      hiddenCount += 1;
      continue;
    }

    section.meetings.forEach((pattern, patternIndex) => {
      const startMinute = minutesFromClock(pattern.startTime);
      const endMinute = minutesFromClock(pattern.endTime);
      const fitsHours = START_MINUTE <= startMinute && endMinute <= END_MINUTE;

      for (const day of pattern.days) {
        const dayIndex = GRID_DAYS.indexOf(day);
        if (dayIndex === -1 || !fitsHours) {
          hiddenCount += 1;
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
    shownCount: meetings.length,
    totalCount: meetings.length + hiddenCount,
  };
}
