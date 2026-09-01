/**
 * The standard class periods for the Minneapolis campus, as minutes since
 * midnight.
 *
 * A class meeting three times a week starts at an "A" time; one meeting twice
 * a week uses a "B" time. Nearly every section lands on one or the other, so
 * showing the two schedules behind the grid makes an off-schedule section
 * visible without anyone having to look the chart up.
 *
 * St Paul keeps a different chart, and is not covered here.
 *
 * @see https://policy.umn.edu/education/classscheduling-appe
 */

export interface MeetingPeriod {
  startMinute: number;
  endMinute: number;
}

const at = (hour: number, minute: number) => hour * 60 + minute;

/** Meet Monday through Friday, 50 minutes each. */
export const A_PERIODS: MeetingPeriod[] = [
  { startMinute: at(8, 0), endMinute: at(8, 50) },
  { startMinute: at(9, 5), endMinute: at(9, 55) },
  { startMinute: at(10, 10), endMinute: at(11, 0) },
  { startMinute: at(11, 15), endMinute: at(12, 5) },
  { startMinute: at(12, 20), endMinute: at(13, 10) },
  { startMinute: at(13, 25), endMinute: at(14, 15) },
  { startMinute: at(14, 30), endMinute: at(15, 20) },
  { startMinute: at(15, 35), endMinute: at(16, 25) },
  { startMinute: at(16, 40), endMinute: at(17, 30) },
];

/** Meet twice a week on T/Th, M/W, W/F or M/F, 75 minutes each. */
export const B_PERIODS: MeetingPeriod[] = [
  { startMinute: at(8, 15), endMinute: at(9, 30) },
  { startMinute: at(9, 45), endMinute: at(11, 0) },
  { startMinute: at(11, 15), endMinute: at(12, 30) },
  { startMinute: at(13, 0), endMinute: at(14, 15) },
  { startMinute: at(14, 30), endMinute: at(15, 45) },
  { startMinute: at(16, 0), endMinute: at(17, 15) },
];
