export interface TimeRange {
  startMinute: number;
  endMinute: number;
}

export interface Meeting extends TimeRange {
  id: string;
  dayIndex: number;
  /** The section this block belongs to, or null for a placeholder time. */
  sectionId: number | null;
}

export type FilterFacet = "course" | "person" | "section" | "component";

/** Every facet, in the order the sidebar lists them and the chips read. */
export const FILTER_FACETS: FilterFacet[] = [
  "course",
  "person",
  "section",
  "component",
];

/** Checked values per facet, as strings so they round-trip through the URL. */
export type ScheduleFilters = Record<FilterFacet, string[]>;

/** The `person` value that names sections with no instructor. */
export const TBA_PERSON = "tba";

/* What /api/sis returns; see app/Http/Resources/Sis. */

export type SisDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

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
  /**
   * True on the section that owns the shared block: the listing's first entry.
   */
  isPrimary: boolean;
}

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

/** The SIS section plus the fields a plan adds. */
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
