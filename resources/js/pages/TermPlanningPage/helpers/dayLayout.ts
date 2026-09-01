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

/** The narrowest a meeting goes before the day widens to make room. */
export const MIN_LANE_WIDTH = 44;

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

/** Which lane each meeting holds, for pinning them through a gesture. */
export type LaneAssignment = Record<string, number>;

/**
 * @param lockedLanes lanes to hold meetings in rather than working them out
 *   afresh. Passed while a gesture is under way: repacking on every pointer
 *   move would slide blocks sideways under the hand that is dragging one.
 */
export function layOutDay(
  meetings: Meeting[],
  lockedLanes?: LaneAssignment,
): DayLayout {
  const lanes = lockedLanes
    ? holdLanes(meetings, lockedLanes)
    : packByStart(meetings);

  const laneCount = lanes.reduce(
    (count, { lane }) => Math.max(count, lane + 1),
    0,
  );

  if (laneCount === 0) return { width: BASE_DAY_WIDTH, placed: [] };

  const laneWidth = Math.max(MIN_LANE_WIDTH, BASE_DAY_WIDTH / laneCount);

  return {
    width: laneCount * laneWidth + CREATE_GUTTER,
    placed: lanes.map(({ meeting, lane }) => ({
      meeting,
      lane,
      left: lane * laneWidth,
      width: laneWidth - LANE_GAP,
    })),
  };
}

export const lanesOf = (layout: DayLayout): LaneAssignment =>
  Object.fromEntries(
    layout.placed.map(({ meeting, lane }) => [meeting.id, lane]),
  );

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

/**
 * Keeps every meeting where it already was. One carried in from another day
 * mid-gesture has no remembered lane, so it takes a fresh one on the right
 * rather than displacing anything.
 */
function holdLanes(
  meetings: Meeting[],
  lockedLanes: LaneAssignment,
): { meeting: Meeting; lane: number }[] {
  let spare = Math.max(-1, ...Object.values(lockedLanes)) + 1;

  return meetings.map((meeting) => ({
    meeting,
    lane: lockedLanes[meeting.id] ?? spare++,
  }));
}
