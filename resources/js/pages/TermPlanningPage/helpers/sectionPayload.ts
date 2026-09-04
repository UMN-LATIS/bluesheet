import type { PlannedSection } from "../types";

/**
 * The body the term planning endpoints take. Written out rather than derived
 * from `PlannedSection` so that the fields the server owns, such as the
 * enrolment totals and the class number, cannot be sent back to it by
 * accident.
 */
export interface SectionPayload {
  termId: number;
  courseCode: string;
  subject: string;
  catalogNumber: string;
  section: string;
  component: string;
  title: string;
  credits: number | null;
  enrollmentCap: number;
  delivery: string;
  notes: string;
  isCancelled: boolean;
  meetings: { days: string[]; startTime: string; endTime: string }[];
  instructors: { emplid: number; role: string }[];
}

export function toSectionPayload(section: PlannedSection): SectionPayload {
  return {
    termId: section.termId,
    courseCode: section.courseCode,
    subject: section.subject,
    catalogNumber: section.catalogNumber,
    section: section.section,
    component: section.component,
    title: section.title,
    credits: section.credits,
    enrollmentCap: section.enrollmentCap,
    delivery: section.delivery,
    notes: section.notes,
    isCancelled: section.isCancelled,
    meetings: section.meetings.map(({ days, startTime, endTime }) => ({
      days,
      startTime,
      endTime,
    })),
    // the roster's names come back from the server on the next read; sending
    // them would invite the two copies to disagree
    instructors: section.instructors.map(({ emplid, role }) => ({
      emplid,
      role,
    })),
  };
}
