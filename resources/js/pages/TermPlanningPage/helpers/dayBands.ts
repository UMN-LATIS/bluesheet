import type { Meeting, PlannedSection } from "../types";
import { formatTime } from "./timeScale";

/** One section meeting, at the time the schedule currently has it. */
export interface DayBandItem {
  meetingId: string;
  section: PlannedSection;
  startMinute: number;
  endMinute: number;
}

/** Everything that begins at one moment of one day. */
export interface DayBand {
  startMinute: number;
  /** "9:45 AM", the heading the band is read by. */
  label: string;
  items: DayBandItem[];
}

/**
 * One day as a list rather than as a canvas: the classes that begin at the
 * same moment, grouped under that moment, in the order the clock runs.
 *
 * The week view answers "how crowded is Tuesday" by drawing time to scale.
 * A list cannot do that, and does not try; it answers "what starts at 9:45",
 * which is the question that survives on a narrow screen, where the week
 * view's lanes are too thin to read. Grouping by start rather than by hour is
 * what keeps the standard periods (9:45, 11:15) intact as single headings.
 */
export function bandsForDay(
  meetings: Meeting[],
  sectionOf: (meetingId: string) => PlannedSection | undefined,
  dayIndex: number,
): DayBand[] {
  const byStart = new Map<number, DayBandItem[]>();

  for (const meeting of meetings) {
    if (meeting.dayIndex !== dayIndex) continue;

    // A time drawn on empty space has no section to name, so it cannot be
    // listed here; the week view is where those are still visible.
    const section = sectionOf(meeting.id);
    if (!section) continue;

    const items = byStart.get(meeting.startMinute) ?? [];
    items.push({
      meetingId: meeting.id,
      section,
      startMinute: meeting.startMinute,
      endMinute: meeting.endMinute,
    });
    byStart.set(meeting.startMinute, items);
  }

  return [...byStart.entries()]
    .sort(([a], [b]) => a - b)
    .map(([startMinute, items]) => ({
      startMinute,
      label: formatTime(startMinute),
      items: [...items].sort(compareByCode),
    }));
}

/** Two sections of one course sit together, and courses read in order. */
const compareByCode = (a: DayBandItem, b: DayBandItem) =>
  `${a.section.subject} ${a.section.catalogNumber} ${a.section.section}`.localeCompare(
    `${b.section.subject} ${b.section.catalogNumber} ${b.section.section}`,
  );

/**
 * The moment the most classes begin at once, which is where a day's pressure
 * on rooms and people actually shows. Null when the day is empty.
 */
export function busiestBand(bands: DayBand[]): DayBand | null {
  return bands.reduce<DayBand | null>(
    (busiest, band) =>
      busiest === null || band.items.length > busiest.items.length
        ? band
        : busiest,
    null,
  );
}
