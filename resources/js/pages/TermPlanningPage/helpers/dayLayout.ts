/**
 * Arranges one day's meetings side by side, so that meetings sharing an hour
 * sit in their own lanes instead of hiding one another.
 *
 * Lanes divide the day evenly until they would grow too narrow to read, after
 * which the day itself widens and the grid scrolls sideways. A department
 * teaching eight classes at noon gets a wide Tuesday rather than eight
 * slivers.
 *
 * Every meeting in a day takes the same width, set by the day's busiest
 * moment, so the lanes line up top to bottom and the eye can follow one down
 * the column. A lone nine o'clock class is therefore as narrow as the noon
 * crowd that set the width.
 *
 * Pure: no DOM, so the arrangement can be reasoned about on its own.
 */

import type { Meeting } from "../types";

/** A day's width while its meetings still divide it comfortably. */
export const BASE_DAY_WIDTH = 250;

/**
 * The narrowest a meeting goes before the day widens to make room. Set by
 * the longest thing a block prints: "11:15a – 12:05p" needs 88px of lane
 * once the block's padding and border are paid for, and the rest is slack
 * for fonts that render a little wider than this machine's.
 */
export const MIN_LANE_WIDTH = 92;

/** Hairline between neighbouring lanes, so two blocks never look like one. */
const LANE_GAP = 1;

/**
 * Empty strip kept clear down the right of every day. Once lanes fill a
 * column there is otherwise nowhere left to press at a busy hour, and a new
 * meeting could not be started there at all.
 */
export const CREATE_GUTTER = 32;

export interface PlacedMeeting {
  meeting: Meeting;
  lane: number;
  left: number;
  width: number;
}

export interface DayLayout {
  width: number;
  placed: PlacedMeeting[];
}

export function layOutDay(meetings: Meeting[]): DayLayout {
  const lanes = packByStart(meetings);

  const laneCount = lanes.reduce(
    (count, { lane }) => Math.max(count, lane + 1),
    0,
  );

  if (laneCount === 0) return { width: BASE_DAY_WIDTH, placed: [] };

  const laneWidth = Math.max(MIN_LANE_WIDTH, BASE_DAY_WIDTH / laneCount);

  return {
    width: laneCount * laneWidth + CREATE_GUTTER,
    // Whole pixels: blocks render crisply, and the width a caller is handed
    // to decide what will fit reads as a number rather than 82.33333333.
    placed: lanes.map(({ meeting, lane }) => ({
      meeting,
      lane,
      left: Math.round(lane * laneWidth),
      width: Math.round(laneWidth - LANE_GAP),
    })),
  };
}

/**
 * Which day an x-offset across the week's columns lands in. Past either end
 * it answers the outermost day, so a meeting cannot escape the week.
 */
export function dayIndexAt(offsetX: number, dayWidths: number[]): number {
  let right = 0;

  for (const [dayIndex, width] of dayWidths.entries()) {
    right += width;
    if (offsetX < right) return dayIndex;
  }

  return dayWidths.length - 1;
}

/**
 * Gives each meeting the first lane free by the time it starts, taking them
 * in order of start.
 *
 * Working in that order is what makes the count of lanes come out equal to
 * the number of meetings running at the busiest moment: a meeting only opens
 * a new lane when every existing one is still occupied, which is to say when
 * it is itself part of the crowd that needs the room.
 */
function packByStart(
  meetings: Meeting[],
): { meeting: Meeting; lane: number }[] {
  const inOrder = [...meetings].sort(
    (a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute,
  );

  const laneEnds: number[] = [];

  return inOrder.map((meeting) => {
    // Touching is not overlapping: a lane a nine o'clock class has just left
    // is free for a ten o'clock one.
    const free = laneEnds.findIndex((end) => end <= meeting.startMinute);
    const lane = free === -1 ? laneEnds.length : free;

    laneEnds[lane] = meeting.endMinute;

    return { meeting, lane };
  });
}
