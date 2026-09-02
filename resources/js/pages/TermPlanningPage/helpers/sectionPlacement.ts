import type { Meeting, PlannedSection, SisDay } from "../types";
import { WEEK_DAYS } from "../types";
import { END_MINUTE, minutesFromClock, START_MINUTE } from "./timeScale";

export const GRID_DAYS: SisDay[] = WEEK_DAYS.slice(0, 5);

/**
 * Derived, not minted, so the id survives refetches; a section cannot meet
 * twice at one day and time.
 */
export const meetingIdOf = (
  sectionId: number,
  day: SisDay,
  startTime: string,
) => `s${sectionId}:${day}:${startTime.replace(":", "")}`;

export interface PlacedSections {
  meetings: Meeting[];
  sectionsByMeetingId: Map<string, PlannedSection>;
  unscheduled: PlannedSection[];
  /** Meetings on weekends or outside the grid's hours, which are not drawn. */
  outsideGridCount: number;
}

export function placeSections(sections: PlannedSection[]): PlacedSections {
  const meetings: Meeting[] = [];
  const sectionsByMeetingId = new Map<string, PlannedSection>();
  const unscheduled: PlannedSection[] = [];
  let outsideGridCount = 0;

  for (const section of sections) {
    // a crosslisted class is drawn once, by its primary section
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
