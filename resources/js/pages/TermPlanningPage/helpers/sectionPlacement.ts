/**
 * Turns the sections the page holds into the meetings the grid draws, and
 * keeps the way back: each placed meeting's id looks up its section, so a
 * block can be labeled without the grid ever learning what a section is.
 */

import type { Meeting, PlannedSection, SisDay } from "../types";
import { WEEK_DAYS } from "../types";
import { END_MINUTE, minutesFromClock, START_MINUTE } from "./timeScale";

/** The days the grid has columns for, in column order. */
export const GRID_DAYS: SisDay[] = WEEK_DAYS.slice(0, 5);

/**
 * A block's name, derived rather than minted, so it survives any rewrite of
 * the section's patterns and any refetch. A section cannot meet twice on one
 * day at one time, which is what makes these three enough.
 */
export const meetingIdOf = (
  sectionId: number,
  day: SisDay,
  startTime: string,
) => `s${sectionId}:${day}:${startTime.replace(":", "")}`;

export interface PlacedSections {
  meetings: Meeting[];
  sectionsByMeetingId: Map<string, PlannedSection>;
  /** Sections with no meeting time, which the tray lists instead. */
  unscheduled: PlannedSection[];
  /**
   * Meetings the grid has no room for: weekend days, or times outside its
   * hours. The page says so when this is not zero, so a missing block reads
   * as a known gap rather than a bug.
   */
  outsideGridCount: number;
}

export function placeSections(sections: PlannedSection[]): PlacedSections {
  const meetings: Meeting[] = [];
  const sectionsByMeetingId = new Map<string, PlannedSection>();
  const unscheduled: PlannedSection[] = [];
  let outsideGridCount = 0;

  for (const section of sections) {
    // A crosslisted class is one block, drawn by its primary; the partner
    // sections are the same class under another number.
    if (section.crosslist && !section.crosslist.isPrimary) continue;

    if (section.meetings.length === 0) {
      unscheduled.push(section);
      continue;
    }

    for (const pattern of section.meetings) {
      const startMinute = minutesFromClock(pattern.startTime);
      const endMinute = minutesFromClock(pattern.endTime);
      const fitsHours = START_MINUTE <= startMinute && endMinute <= END_MINUTE;

      for (const day of pattern.days) {
        const dayIndex = GRID_DAYS.indexOf(day);
        if (dayIndex === -1 || !fitsHours) {
          outsideGridCount += 1;
          continue;
        }

        const id = meetingIdOf(section.id, day, pattern.startTime);

        meetings.push({
          id,
          dayIndex,
          startMinute,
          endMinute,
          sectionId: section.id,
        });
        sectionsByMeetingId.set(id, section);
      }
    }
  }

  return {
    meetings,
    sectionsByMeetingId,
    unscheduled,
    outsideGridCount,
  };
}
