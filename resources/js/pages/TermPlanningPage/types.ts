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

/**
 * How a block is coloured. "discussion" covers the meetings a class splits
 * into, which the SIS calls DIS and LAB. A block with no tone has no class
 * on it yet.
 */
export type BlockTone = "lecture" | "discussion";

/**
 * The kinds of thing a section can be narrowed by. Each is a list in the
 * sidebar and a run of chips in the filter bar.
 */
export type FilterFacet = "course" | "person" | "section" | "component";

/** Every facet, in the order the sidebar lists them and the chips read. */
export const FILTER_FACETS: FilterFacet[] = [
  "course",
  "person",
  "section",
  "component",
];

/**
 * What is checked, per facet. Nothing checked in a facet means that facet
 * does not narrow anything. Values are strings throughout, emplids and
 * section ids included, so the shape round-trips through a URL unchanged.
 */
export type ScheduleFilters = Record<FilterFacet, string[]>;

/** The `person` value that names sections with no instructor. */
export const TBA_PERSON = "tba";

/*
 * What the /api/sis endpoints return, mirroring the resources in
 * app/Http/Resources/Sis. The payloads arrive ready to render: instructors
 * are embedded, the crosslist is parsed, and meeting rows without times are
 * already dropped.
 */

/** A weekday as the SIS names it. */
export type SisDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface SisTerm {
  /** The term code, e.g. 1269. */
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

/** One meeting pattern: the same clock times on each of `days`. */
export interface SisSectionMeeting {
  days: SisDay[];
  /** 24-hour clock, e.g. "10:10". */
  startTime: string;
  endTime: string;
}

export interface SisInstructor {
  emplid: number;
  role: string;
  name: string | null;
  /** Sent separately: a narrow block cannot split a full name safely. */
  lastName: string | null;
  internetId: string | null;
}

export interface SisCrosslist {
  raw: string;
  partners: { subject: string; catalogNumber: string; section: string }[];
  /** True on the section that owns the shared block: the listing's first entry. */
  isPrimary: boolean;
}

export interface SisSection {
  id: number;
  classNumber: number;
  termId: number;
  courseCode: string;
  subject: string;
  catalogNumber: string;
  section: string;
  title: string;
  component: string;
  credits: number | null;
  enrollmentCap: number;
  enrollmentTotal: number;
  waitlistCap: number;
  waitlistTotal: number;
  instructors: SisInstructor[];
  /** Empty when the section has no set meeting time. */
  meetings: SisSectionMeeting[];
  crosslist: SisCrosslist | null;
}
