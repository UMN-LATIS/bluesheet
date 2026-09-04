/**
 * Lays out one day's meetings in lanes. Lanes divide the day evenly until
 * they would be too narrow to read, after which the day itself widens.
 */

import type { Meeting } from "../types";

export const BASE_DAY_WIDTH = 250;

/** What "ANTH-3005W-001" needs in a block, plus slack for wider fonts. */
export const MIN_LANE_WIDTH = 112;

const LANE_GAP = 1;

/**
 * Space kept free at the right of every day,
 * so a busy hour still has somewhere to press.
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

  // the gutter too, so a day does not resize under the pointer as its first
  // section lands in it
  if (laneCount === 0) {
    return { width: BASE_DAY_WIDTH + CREATE_GUTTER, placed: [] };
  }

  const laneWidth = Math.max(MIN_LANE_WIDTH, BASE_DAY_WIDTH / laneCount);

  return {
    width: laneCount * laneWidth + CREATE_GUTTER,
    placed: lanes.map(({ meeting, lane }) => ({
      meeting,
      lane,
      left: Math.round(lane * laneWidth),
      width: Math.round(laneWidth - LANE_GAP),
    })),
  };
}

/** Past either end, the outermost day. */
export function dayIndexAt(offsetX: number, dayWidths: number[]): number {
  let right = 0;

  for (const [dayIndex, width] of dayWidths.entries()) {
    right += width;
    if (offsetX < right) return dayIndex;
  }

  return dayWidths.length - 1;
}

/**
 * First-fit by start time, which yields exactly
 * as many lanes as the busiest moment needs.
 */
function packByStart(
  meetings: Meeting[],
): { meeting: Meeting; lane: number }[] {
  const inOrder = [...meetings].sort(
    (a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute,
  );

  const laneEnds: number[] = [];

  return inOrder.map((meeting) => {
    // touching is not overlapping
    const free = laneEnds.findIndex((end) => end <= meeting.startMinute);
    const lane = free === -1 ? laneEnds.length : free;

    laneEnds[lane] = meeting.endMinute;

    return { meeting, lane };
  });
}
