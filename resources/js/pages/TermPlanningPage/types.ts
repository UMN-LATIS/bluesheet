/** A stretch of one day, which is all a meeting is until it carries a class. */
export interface TimeRange {
  startMinute: number;
  endMinute: number;
}

/** A meeting placed on the grid: a time range on one weekday. */
export interface Meeting extends TimeRange {
  id: string;
  dayIndex: number;
}
