/**
 * Colour on this page means one thing: what kind of meeting a block is. The
 * lecture is the warm primary; discussion and lab are a cool pair, alike in
 * weight and near in hue, since to a scheduler they are the same kind of
 * thing (the meetings a class splits into). Blue is left alone on purpose,
 * because everywhere else in the app blue means "you can click this".
 *
 * Every class here is written out in full so Tailwind can see it.
 */
export interface MeetingTypeColour {
  label: string;
  /** Classes for a block: its edge, fill, and the ring it wears when selected. */
  block: string;
  /** Classes for the key's swatch and a tray chip's edge. */
  swatch: string;
}

const LECTURE: MeetingTypeColour = {
  label: "Lecture",
  block:
    "tw-border-l-4 tw-border-l-amber-500 tw-bg-amber-50 tw-outline-amber-500",
  swatch: "tw-border-l-amber-500 tw-bg-amber-50",
};

const DISCUSSION: MeetingTypeColour = {
  label: "Discussion",
  block:
    "tw-border-l-[3px] tw-border-l-indigo-400 tw-bg-indigo-50 tw-outline-indigo-400",
  swatch: "tw-border-l-indigo-400 tw-bg-indigo-50",
};

const LAB: MeetingTypeColour = {
  label: "Lab",
  block:
    "tw-border-l-[3px] tw-border-l-violet-400 tw-bg-violet-50 tw-outline-violet-400",
  swatch: "tw-border-l-violet-400 tw-bg-violet-50",
};

/** Everything else the SIS names: IND, FWK, and a block with no class yet. */
export const OTHER_TYPE_COLOUR: MeetingTypeColour = {
  label: "Other",
  block:
    "tw-border-l-[3px] tw-border-l-slate-300 tw-bg-white tw-outline-slate-400",
  swatch: "tw-border-l-slate-300 tw-bg-white",
};

/** Keyed by the SIS component code, in the order the key lists them. */
export const MEETING_TYPE_COLOURS: Record<string, MeetingTypeColour> = {
  LEC: LECTURE,
  DIS: DISCUSSION,
  LAB: LAB,
};

export function colourOfType(component: string | undefined): MeetingTypeColour {
  return (component && MEETING_TYPE_COLOURS[component]) || OTHER_TYPE_COLOUR;
}
