/**
 * Block colors by meeting type. Blue is avoided: elsewhere in the app it
 * means "clickable". Classes are written out in full so Tailwind can see them.
 */
export interface MeetingTypeColor {
  label: string;
  block: string;
  swatch: string;
  tint: string;
}

const LECTURE: MeetingTypeColor = {
  label: "Lecture",
  block:
    "tw-border-l-4 tw-border-l-amber-500 tw-bg-amber-50 tw-outline-amber-500",
  swatch: "tw-border-l-amber-500 tw-bg-amber-50",
  tint: "tw-bg-amber-50",
};

const DISCUSSION: MeetingTypeColor = {
  label: "Discussion",
  block:
    "tw-border-l-[3px] tw-border-l-indigo-400 tw-bg-indigo-50 tw-outline-indigo-400",
  swatch: "tw-border-l-indigo-400 tw-bg-indigo-50",
  tint: "tw-bg-indigo-50",
};

const LAB: MeetingTypeColor = {
  label: "Lab",
  block:
    "tw-border-l-[3px] tw-border-l-violet-400 tw-bg-violet-50 tw-outline-violet-400",
  swatch: "tw-border-l-violet-400 tw-bg-violet-50",
  tint: "tw-bg-violet-50",
};

export const OTHER_TYPE_COLOR: MeetingTypeColor = {
  label: "Other",
  block:
    "tw-border-l-[3px] tw-border-l-slate-300 tw-bg-white tw-outline-slate-400",
  swatch: "tw-border-l-slate-300 tw-bg-white",
  tint: "tw-bg-surface-container",
};

export const MEETING_TYPE_COLORS: Record<string, MeetingTypeColor> = {
  LEC: LECTURE,
  DIS: DISCUSSION,
  LAB: LAB,
};

export function colorOfType(component: string | undefined): MeetingTypeColor {
  return (component && MEETING_TYPE_COLORS[component]) || OTHER_TYPE_COLOR;
}
