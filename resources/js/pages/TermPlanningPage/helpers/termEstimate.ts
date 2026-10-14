import type { CostAssumptions, JobCodeRate } from "@/types";
import type { PlannedSection, SisInstructor } from "../types";
import type { CostBasis } from "./costBasis";
import type { RateOverrides } from "./costOverrides";
import {
  instructorRateOf,
  isFreeComponent,
  isGradJobCodeRate,
  pricingOf,
  taRateOf,
  unstaffedRateOf,
  type PersonPricing,
  type Rate,
  type TermRates,
} from "./costRules";
import {
  gradCostOf,
  gradTermOf,
  defaultAppointmentOf,
  type GradCost,
  type GradStudent,
  type GradTerm,
} from "./gradCost";
import { blockOwners } from "./sectionPlacement";
import { assistantsOf, instructorsOfRecord, TA_ROLE } from "./sectionPeople";

const LECTURE = "LEC";

export interface CostLine {
  role: "instructor" | "ta" | "unstaffedSection";
  /** Null on the unstaffed line, which names no one. */
  emplid: number | null;
  /** Null when no rate exists. */
  salary: number | null;
  /** Null when no rate exists. */
  fringe: number | null;
  /** Salary plus fringe. Null when no rate exists. */
  amount: number | null;
  basis: CostBasis;
  /**
   * Only on the one line that carries a grad student's
   * term cost. Its salary is the pay, and its fringe is
   * health plus tuition.
   */
  gradAppointment?: GradAppointment;
}

export interface GradAppointment {
  student: GradStudent;
  /** Null when the term has no grad inputs or hours. */
  cost: GradCost | null;
}

export interface SectionCost {
  lines: CostLine[];
  instructorCost: number;
  taCost: number;
  total: number;
}

interface EstimateInput {
  sections: PlannedSection[];
  assumptions: CostAssumptions;
  rateOverrides: RateOverrides;
}

interface CostContext {
  pricingOfEmplid: (emplid: number) => PersonPricing;
  /** The partner a crosslisted section is costed on, or null. */
  crosslistOwnerOf: (section: PlannedSection) => number | null;
  chargedSectionIdByTaCourse: Map<string, number>;
  /** Null when the course has no live lecture. */
  lectureSectionIdOf: (section: PlannedSection) => number | null;
  termRates: TermRates;
  isGradStudent: (emplid: number) => boolean;
}

/**
 * By section id. A cancelled section is present with no
 * lines.
 */
export function estimateTermCost(
  input: EstimateInput,
): Map<number, SectionCost> {
  const { sections, assumptions, rateOverrides } = input;
  const pricingOfEmplid = pricingByEmplidOf(assumptions, rateOverrides);
  const gradTerm = gradTermOf(assumptions, rateOverrides);

  const liveSections = sections.filter(({ isCancelled }) => !isCancelled);
  const crosslistOwnerByListing = blockOwners(liveSections);
  const crosslistOwnerOf = (section: PlannedSection): number | null => {
    const listing = section.crosslist?.raw;
    if (listing === undefined) return null;

    return crosslistOwnerByListing.get(listing) ?? null;
  };
  const isCostedHere = (section: PlannedSection) =>
    (crosslistOwnerOf(section) ?? section.id) === section.id;

  const sectionsThatCanChargeATa = liveSections.filter(
    (section) => isCostedHere(section) && !isFreeComponent(section.component),
  );
  const lectureSectionIdByCourseCode =
    firstLectureSectionIdByCourseCodeOf(liveSections);
  const context: CostContext = {
    pricingOfEmplid,
    crosslistOwnerOf,
    lectureSectionIdOf: ({ courseCode }) =>
      lectureSectionIdByCourseCode.get(courseCode) ?? null,
    chargedSectionIdByTaCourse: chargedSectionIdByTaCourseOf(
      sectionsThatCanChargeATa,
    ),
    termRates: termRatesOf(assumptions, rateOverrides),
    isGradStudent: (emplid) => isGradJobCodeRate(pricingOfEmplid(emplid).rate),
  };
  const linesBySectionId = paidOncePerMeetingTime(
    liveSections,
    new Map(
      sections.map((section) => [section.id, costLinesOf(section, context)]),
    ),
  );
  const linesWithGradAppointments = chargedOncePerGradStudent(
    liveSections,
    linesBySectionId,
    {
      gradTerm,
      pricingOfEmplid,
      isGradStudent: context.isGradStudent,
      rateOverrides,
    },
  );

  return new Map(
    sections.map((section) => [
      section.id,
      sectionCostOf(linesWithGradAppointments.get(section.id) ?? []),
    ]),
  );
}

export function pricingByEmplidOf(
  assumptions: CostAssumptions,
  rateOverrides: RateOverrides,
): (emplid: number) => PersonPricing {
  const ratesByJobCode = ratesByJobCodeOf(assumptions);
  const jobCodesByEmplid = new Map(
    assumptions.people.map((person) => [person.emplid, person.jobCodes]),
  );

  return (emplid) =>
    pricingOf(
      jobCodesByEmplid.get(emplid) ?? [],
      ratesByJobCode,
      rateOverrides,
    );
}

export const termRatesOf = (
  assumptions: CostAssumptions,
  rateOverrides: RateOverrides,
): TermRates => ({
  ratesByJobCode: ratesByJobCodeOf(assumptions),
  overrides: rateOverrides,
});

const ratesByJobCodeOf = (assumptions: CostAssumptions) =>
  new Map<string, JobCodeRate>(
    assumptions.jobCodes.map((rate) => [rate.code, rate]),
  );

function costLinesOf(
  section: PlannedSection,
  context: CostContext,
): CostLine[] {
  if (section.isCancelled) return [];

  const { termRates } = context;
  const leads = instructorsOfRecord(section.instructors);
  const tas = assistantsOf(section.instructors).filter(
    ({ role }) => role === TA_ROLE,
  );

  const crosslistOwnerId = context.crosslistOwnerOf(section);
  if (crosslistOwnerId !== null && crosslistOwnerId !== section.id) {
    return crosslistPartnerLines(crosslistOwnerId, [...leads, ...tas]);
  }

  if (isFreeComponent(section.component)) {
    return freeComponentLines([...leads, ...tas]);
  }

  const lectureSectionId = context.lectureSectionIdOf(section);
  const isPaidOnLecture =
    section.component !== LECTURE && lectureSectionId !== null;

  if (leads.length === 0 && tas.length === 0) {
    return [
      {
        role: "unstaffedSection",
        emplid: null,
        ...(isPaidOnLecture
          ? paidOnLectureLine(lectureSectionId)
          : ratedLine(unstaffedRateOf(termRates))),
      },
    ];
  }

  const leadLines = leads.map(
    (lead): CostLine => ({
      role: "instructor",
      emplid: lead.emplid,
      ...leadPricedLineOf(lead, lectureSectionId, isPaidOnLecture, context),
    }),
  );
  const taLines = tas.map((ta) => taLineOf(ta, section, context));

  return [...leadLines, ...taLines];
}

type PricedLine = Pick<CostLine, "salary" | "fringe" | "amount" | "basis">;

const NOTHING_OWED = { salary: 0, fringe: 0, amount: 0 };

const gradAppointmentPlaceholder: PricedLine = {
  ...NOTHING_OWED,
  basis: { kind: "rate" },
};

function ratedLine(rate: Rate | null, salaryOverride?: number): PricedLine {
  const salary = salaryOverride ?? rate?.salary;
  if (salary === undefined) {
    return {
      salary: null,
      fringe: null,
      amount: null,
      basis: { kind: "rate" },
    };
  }

  const fringe = salary * (rate?.fringeRate ?? 0);

  return { salary, fringe, amount: salary + fringe, basis: { kind: "rate" } };
}

function leadPricedLineOf(
  lead: SisInstructor,
  lectureSectionId: number | null,
  isPaidOnLecture: boolean,
  context: CostContext,
): PricedLine {
  if (isPaidOnLecture && lectureSectionId !== null) {
    return paidOnLectureLine(lectureSectionId);
  }
  if (context.isGradStudent(lead.emplid)) return gradAppointmentPlaceholder;

  return ratedLine(
    instructorRateOf(context.pricingOfEmplid(lead.emplid), context.termRates),
    context.termRates.overrides.salaryByEmplid.get(lead.emplid),
  );
}

const paidOnLectureLine = (lectureSectionId: number): PricedLine => ({
  ...NOTHING_OWED,
  basis: { kind: "paidOnLecture", lectureSectionId },
});

function taLineOf(
  ta: SisInstructor,
  section: PlannedSection,
  context: CostContext,
): CostLine {
  const { pricingOfEmplid, chargedSectionIdByTaCourse, termRates } = context;
  if (context.isGradStudent(ta.emplid)) {
    return { role: "ta", emplid: ta.emplid, ...gradAppointmentPlaceholder };
  }

  const chargedSectionId =
    chargedSectionIdByTaCourse.get(
      taCourseKey(ta.emplid, section.courseCode),
    ) ?? section.id;

  if (chargedSectionId !== section.id) {
    return {
      role: "ta",
      emplid: ta.emplid,
      ...NOTHING_OWED,
      basis: {
        kind: "chargedOnOtherSection",
        sectionId: chargedSectionId,
        reason: "taOncePerCourse",
      },
    };
  }

  return {
    role: "ta",
    emplid: ta.emplid,
    ...ratedLine(taRateOf(pricingOfEmplid(ta.emplid), termRates)),
  };
}

export interface CostTotals {
  instructorCost: number;
  taCost: number;
  total: number;
  /** Lines with no rate add nothing to the totals. */
  missingRateCount: number;
}

export function totalsOf(costs: SectionCost[]): CostTotals {
  const lines = costs.flatMap(({ lines }) => lines);

  return {
    instructorCost: sum(costs.map(({ instructorCost }) => instructorCost)),
    taCost: sum(costs.map(({ taCost }) => taCost)),
    total: sum(costs.map(({ total }) => total)),
    missingRateCount: lines.filter(({ amount }) => amount === null).length,
  };
}

function sectionCostOf(lines: CostLine[]): SectionCost {
  const amountOf = (role: CostLine["role"][]) =>
    sum(
      lines
        .filter((line) => role.includes(line.role))
        .map(({ amount }) => amount ?? 0),
    );
  const instructorCost = amountOf(["instructor", "unstaffedSection"]);
  const taCost = amountOf(["ta"]);

  return { lines, instructorCost, taCost, total: instructorCost + taCost };
}

function crosslistPartnerLines(
  ownerSectionId: number,
  people: SisInstructor[],
): CostLine[] {
  const basis: CostBasis = {
    kind: "chargedOnOtherSection",
    sectionId: ownerSectionId,
    reason: "crosslisted",
  };

  if (people.length === 0) {
    return [{ role: "unstaffedSection", emplid: null, ...NOTHING_OWED, basis }];
  }

  return people.map((person) => ({
    role: person.role === TA_ROLE ? "ta" : "instructor",
    emplid: person.emplid,
    ...NOTHING_OWED,
    basis,
  }));
}

function freeComponentLines(people: SisInstructor[]): CostLine[] {
  const basis: CostBasis = { kind: "freeComponent" };

  if (people.length === 0) {
    return [{ role: "unstaffedSection", emplid: null, ...NOTHING_OWED, basis }];
  }

  return people.map((person) => ({
    role: person.role === TA_ROLE ? "ta" : "instructor",
    emplid: person.emplid,
    ...NOTHING_OWED,
    basis,
  }));
}

function firstLectureSectionIdByCourseCodeOf(
  sections: PlannedSection[],
): Map<string, number> {
  const lectures = sections
    .filter(({ component }) => component === LECTURE)
    .sort((a, b) => a.section.localeCompare(b.section));
  const firstSectionIdByCourseCode = new Map<string, number>();

  for (const { courseCode, id } of lectures) {
    if (!firstSectionIdByCourseCode.has(courseCode)) {
      firstSectionIdByCourseCode.set(courseCode, id);
    }
  }

  return firstSectionIdByCourseCode;
}

const taCourseKey = (emplid: number, courseCode: string) =>
  `${emplid}|${courseCode}`;

function chargedSectionIdByTaCourseOf(
  sections: PlannedSection[],
): Map<string, number> {
  const byPreference = [...sections].sort(lecturesThenCourseAndSection);
  const charged = new Map<string, number>();

  for (const section of byPreference) {
    for (const { emplid, role } of section.instructors) {
      const key = taCourseKey(emplid, section.courseCode);
      if (role === TA_ROLE && !charged.has(key)) charged.set(key, section.id);
    }
  }

  return charged;
}

function lecturesThenCourseAndSection(
  a: PlannedSection,
  b: PlannedSection,
): number {
  const isLecture = (section: PlannedSection) => section.component === LECTURE;
  if (isLecture(a) !== isLecture(b)) return isLecture(a) ? -1 : 1;

  return (
    a.courseCode.localeCompare(b.courseCode) ||
    a.section.localeCompare(b.section)
  );
}

function meetingTimeKeyOf({ meetings }: PlannedSection): string | null {
  if (meetings.length === 0) return null;

  return meetings
    .map(
      ({ days, startTime, endTime }) =>
        `${[...days].sort().join(",")} ${startTime}-${endTime}`,
    )
    .sort()
    .join("|");
}

function paidOncePerMeetingTime(
  sections: PlannedSection[],
  linesBySectionId: Map<number, CostLine[]>,
): Map<number, CostLine[]> {
  const paidSectionIdByPersonMeeting = new Map<string, number>();
  const result = new Map(linesBySectionId);

  for (const section of [...sections].sort(lecturesThenCourseAndSection)) {
    const meetingTimeKey = meetingTimeKeyOf(section);
    if (meetingTimeKey === null) continue;

    const lines = linesBySectionId.get(section.id) ?? [];
    result.set(
      section.id,
      lines.map((line): CostLine => {
        if (line.emplid === null || line.basis.kind !== "rate") return line;

        const key = `${line.emplid}|${meetingTimeKey}`;
        const paidSectionId = paidSectionIdByPersonMeeting.get(key);
        if (paidSectionId === undefined) {
          paidSectionIdByPersonMeeting.set(key, section.id);
          return line;
        }

        return {
          ...line,
          ...NOTHING_OWED,
          basis: {
            kind: "chargedOnOtherSection",
            sectionId: paidSectionId,
            reason: "sameMeetingTime",
          },
        };
      }),
    );
  }

  return result;
}

interface GradCharging {
  gradTerm: GradTerm | null;
  pricingOfEmplid: (emplid: number) => PersonPricing;
  isGradStudent: (emplid: number) => boolean;
  rateOverrides: RateOverrides;
}

function chargedOncePerGradStudent(
  sections: PlannedSection[],
  linesBySectionId: Map<number, CostLine[]>,
  { gradTerm, pricingOfEmplid, isGradStudent, rateOverrides }: GradCharging,
): Map<number, CostLine[]> {
  const isGradAppointmentLine = (
    line: CostLine,
  ): line is CostLine & { emplid: number } =>
    line.emplid !== null &&
    line.basis.kind === "rate" &&
    isGradStudent(line.emplid);
  const chargedSectionIdByEmplid = new Map<number, number>();
  const creditsByEmplid = new Map<number, number>();

  for (const section of [...sections].sort(lecturesThenCourseAndSection)) {
    for (const line of linesBySectionId.get(section.id) ?? []) {
      if (!isGradAppointmentLine(line)) continue;

      const { emplid } = line;
      if (!chargedSectionIdByEmplid.has(emplid)) {
        chargedSectionIdByEmplid.set(emplid, section.id);
      }
      if (line.role === "instructor") {
        creditsByEmplid.set(
          emplid,
          (creditsByEmplid.get(emplid) ?? 0) + (section.credits ?? 0),
        );
      }
    }
  }

  return new Map(
    [...linesBySectionId].map(([sectionId, lines]) => [
      sectionId,
      lines.map((line): CostLine => {
        if (!isGradAppointmentLine(line)) return line;

        const chargedSectionId = chargedSectionIdByEmplid.get(line.emplid);
        if (chargedSectionId !== sectionId) {
          return {
            ...line,
            ...NOTHING_OWED,
            basis: {
              kind: "chargedOnOtherSection",
              sectionId: chargedSectionId ?? sectionId,
              reason: "gradAppointment",
            },
          };
        }

        const rate = pricingOfEmplid(line.emplid).rate;
        const setting = rateOverrides.gradPeopleByEmplid.get(line.emplid);
        const student: GradStudent = {
          appointmentPercent:
            setting?.appointmentPercent ?? defaultAppointmentOf(rateOverrides),
          isAbd: rate?.studentStatus === "abd",
          hasFeeOffset: setting?.hasFeeOffset ?? false,
          isInternational: setting?.isInternational ?? false,
          creditsTaught:
            rate?.instructorType === "graduate_instructor"
              ? (creditsByEmplid.get(line.emplid) ?? 0)
              : 0,
        };
        const cost = gradCostOf(gradTerm, student);

        return {
          ...line,
          salary: cost?.pay ?? null,
          fringe: cost?.fringe ?? null,
          amount: cost?.total ?? null,
          gradAppointment: { student, cost },
        };
      }),
    ]),
  );
}

const sum = (amounts: number[]) =>
  amounts.reduce((total, amount) => total + amount, 0);
