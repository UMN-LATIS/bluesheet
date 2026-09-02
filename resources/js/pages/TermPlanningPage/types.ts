/** A stretch of one day, which is all a meeting is until it carries a class. */
export interface TimeRange {
  startMinute: number;
  endMinute: number;
}

/** A meeting placed on the grid: a time range on one weekday. */
export interface Meeting extends TimeRange {
  id: string;
  dayIndex: number;
  /** The section this block belongs to, or null for a placeholder time. */
  sectionId: number | null;
}

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

/** Every weekday, in the order a week runs, which is how days are listed. */
export const WEEK_DAYS: SisDay[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

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

/** Someone on the department roster, who a section can be assigned to. */
export interface SisEmployee {
  emplid: number;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  internetId: string | null;
  positionTitle: string | null;
  category: string | null;
}

/** How a section is taught, which the SIS has no column for. */
export type Delivery = "onCampus" | "blended" | "online";

/**
 * A section as the plan holds it: the SIS row plus the fields a plan adds.
 * Named for `planned_sections`, the table these two are headed for.
 */
export type PlannedSection = SisSection & {
  delivery: Delivery;
  notes: string;
};

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
