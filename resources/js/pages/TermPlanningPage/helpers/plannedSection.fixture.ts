import type { PlannedSection, SisSectionMeeting } from "../types";

export const plannedSection = (
  id: number,
  meetings: SisSectionMeeting[],
  extra: Partial<PlannedSection> = {},
): PlannedSection => ({
  id,
  classNumber: 50000 + id,
  termId: 1269,
  courseCode: "ANTH-1001",
  subject: "ANTH",
  catalogNumber: "1001",
  section: "001",
  title: "Understanding Cultures",
  component: "LEC",
  credits: 3,
  enrollmentCap: 30,
  enrollmentTotal: 20,
  waitlistCap: 5,
  waitlistTotal: 0,
  instructors: [],
  meetings,
  crosslist: null,
  delivery: "onCampus",
  notes: "",
  ...extra,
});
