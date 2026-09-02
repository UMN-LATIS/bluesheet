/**
 * Color on this page means one thing: what kind of meeting a block is. The
 * lecture is the warm primary; discussion and lab are a cool pair, alike in
 * weight and near in hue, since to a scheduler they are the same kind of
 * thing (the meetings a class splits into). Blue is left alone on purpose,
 * because everywhere else in the app blue means "you can click this", and it
 * is what marks the one section a sheet is open on.
 *
 * The colors are named as roles rather than as a finished block, because the
 * same type appears at four sizes: a week block, a day card, an async chip,
 * and a swatch beside its name. Each picks the parts it needs and sets its
 * own rail width.
 *
 * Every class is written out in full so Tailwind can see it.
 */
export interface MeetingTypeColor {
  /** The SIS component code, e.g. "LEC". */
  code: string;
  /** What that code means in words, e.g. "Lecture". */
  label: string;
  /** The fill behind a block, card or chip. */
  tint: string;
  /** The colored left edge; the caller sets the width. */
  rail: string;
  /** A solid square or dot of the type's color, for a swatch. */
  dot: string;
  /** Fill and border for the sheet's small type badge. */
  badge: string;
}

const LECTURE: MeetingTypeColor = {
  code: "LEC",
  label: "Lecture",
  tint: "tw-bg-amber-50",
  rail: "tw-border-l-amber-500",
  dot: "tw-bg-amber-500",
  badge: "tw-bg-amber-50 tw-border-amber-500",
};

const DISCUSSION: MeetingTypeColor = {
  code: "DIS",
  label: "Discussion",
  tint: "tw-bg-indigo-50",
  rail: "tw-border-l-indigo-400",
  dot: "tw-bg-indigo-400",
  badge: "tw-bg-indigo-50 tw-border-indigo-400",
};

const LAB: MeetingTypeColor = {
  code: "LAB",
  label: "Lab",
  tint: "tw-bg-violet-50",
  rail: "tw-border-l-violet-400",
  dot: "tw-bg-violet-400",
  badge: "tw-bg-violet-50 tw-border-violet-400",
};

/**
 * Everything else the SIS names: IND, FWK, and a block with no class yet. Its
 * fill is a cool grey rather than white, or a field-work block would have no
 * edge against the white of the grid it sits on.
 */
export const OTHER_TYPE_COLOR: MeetingTypeColor = {
  code: "",
  label: "Other",
  tint: "tw-bg-slate-100",
  rail: "tw-border-l-slate-300",
  dot: "tw-bg-slate-300",
  badge: "tw-bg-surface-container tw-border-outline",
};

/** Keyed by the SIS component code, in the order a key lists them. */
export const MEETING_TYPE_COLORS: Record<string, MeetingTypeColor> = {
  LEC: LECTURE,
  DIS: DISCUSSION,
  LAB: LAB,
};

export function colorOfType(component: string | undefined): MeetingTypeColor {
  return (component && MEETING_TYPE_COLORS[component]) || OTHER_TYPE_COLOR;
}

/**
 * What a component code means, for the places that have room to say it: the
 * Types list in the filters panel, and the sheet's component select.
 */
export const COMPONENT_LABELS: Record<string, string> = {
  LEC: "Lecture",
  DIS: "Discussion",
  LAB: "Lab",
  FWK: "Field work",
  IND: "Independent study",
  SEM: "Seminar",
};

/** The code's meaning, or the code itself when the import sends a new one. */
export const labelOfComponent = (code: string) =>
  COMPONENT_LABELS[code] ?? code;
