import type { CostAssumptions, JobCodeRate } from "@/types";
import type { PlannedSection, SisInstructor } from "../types";
import type { CostBasis } from "./costBasis";
import type { RateOverrides } from "./costOverrides";
import {
  instructorRateOf,
  isFreeComponent,
  isGradJobCodeRate,
  LECTURE,
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
  appointmentPercentOfSection,
  defaultAppointmentOf,
  type GradCost,
  type GradStudent,
  type GradTerm,
} from "./gradCost";
import type { PersonInputs } from "./personInputs";
import { blockOwners } from "./sectionPlacement";
import { assistantsOf, instructorsOfRecord, TA_ROLE } from "./sectionPeople";

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
   * On each line that carries a share of a grad student's
   * appointment, in proportion to this section's part of
   * it: that share of the pay, as salary, and of health plus
   * tuition, as fringe.
   */
  gradAppointment?: GradAppointment;
  /** This section's part of a grad student's appointment. */
  sectionAppointment?: SectionAppointment;
}

export interface GradAppointment {
  /** Its appointment is the sum of the person's sections' parts. */
  student: GradStudent;
  /** For the whole appointment. Null when the term has no grad inputs or levels. */
  cost: GradCost | null;
}

export interface SectionAppointment {
  percent: number;
  /** The default for the person's role on this section. */
  percentWithoutOverride: number;
  /** True when the section names a percent for this person. */
  isOverridden: boolean;
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
  /**
   * The lecture of the section's course that the person is
   * on, so they are paid there instead. Null on a lecture,
   * or when they are on none of the course's lectures.
   */
  lectureSectionIdOf: (
    emplid: number,
    section: PlannedSection,
  ) => number | null;
  termRates: TermRates;
  rateOverrides: RateOverrides;
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
  const pricingOfEmplid = pricingByEmplidOf(assumptions);
  const gradTerm = gradTermOf(assumptions);

  const liveSections = sections.filter(({ isCancelled }) => !isCancelled);
  const crosslistOwnerByListing = blockOwners(liveSections);
  const crosslistOwnerOf = (section: PlannedSection): number | null => {
    const listing = section.crosslist?.raw;
    if (listing === undefined) return null;

    return crosslistOwnerByListing.get(listing) ?? null;
  };

  const lectureSectionIdByPersonCourse =
    lectureSectionIdByPersonCourseOf(liveSections);
  const context: CostContext = {
    pricingOfEmplid,
    crosslistOwnerOf,
    lectureSectionIdOf: (emplid, { component, courseCode }) =>
      component === LECTURE
        ? null
        : (lectureSectionIdByPersonCourse.get(
            personCourseKey(emplid, courseCode),
          ) ?? null),
    termRates: termRatesOf(assumptions),
    rateOverrides,
    isGradStudent: (emplid) => isGradJobCodeRate(pricingOfEmplid(emplid).rate),
  };
  const linesBySectionId = paidOncePerMeetingTime(
    liveSections,
    new Map(
      sections.map((section) => [section.id, costLinesOf(section, context)]),
    ),
  );
  const linesWithGradAppointments = gradAppointmentsSplitAcrossSections(
    liveSections,
    linesBySectionId,
    {
      gradTerm,
      pricingOfEmplid,
      isGradStudent: context.isGradStudent,
      rateOverrides,
      assumptions,
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
): (emplid: number) => PersonPricing {
  const ratesByJobCode = ratesByJobCodeOf(assumptions);
  const jobCodesByEmplid = new Map(
    assumptions.people.map((person) => [person.emplid, person.jobCodes]),
  );

  return (emplid) =>
    pricingOf(jobCodesByEmplid.get(emplid) ?? [], ratesByJobCode);
}

export const termRatesOf = (assumptions: CostAssumptions): TermRates => ({
  ratesByJobCode: ratesByJobCodeOf(assumptions),
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

  if (leads.length === 0 && tas.length === 0) {
    return [
      {
        role: "unstaffedSection",
        emplid: null,
        ...ratedLine(unstaffedRateOf(termRates), undefined),
      },
    ];
  }

  const leadLines = leads.map(
    (lead): CostLine => ({
      role: "instructor",
      emplid: lead.emplid,
      ...leadPricedLineOf(lead, section, context),
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

function ratedLine(
  rate: Rate | null,
  overrides: Pick<PersonInputs, "salary" | "fringeRate"> | undefined,
): PricedLine {
  const salary = overrides?.salary ?? rate?.salary;
  if (salary === undefined) {
    return {
      salary: null,
      fringe: null,
      amount: null,
      basis: { kind: "rate" },
    };
  }

  const fringe = salary * (overrides?.fringeRate ?? rate?.fringeRate ?? 0);

  return { salary, fringe, amount: salary + fringe, basis: { kind: "rate" } };
}

function leadPricedLineOf(
  lead: SisInstructor,
  section: PlannedSection,
  context: CostContext,
): PricedLine {
  const lectureSectionId = context.lectureSectionIdOf(lead.emplid, section);
  if (lectureSectionId !== null) return paidOnLectureLine(lectureSectionId);
  if (context.isGradStudent(lead.emplid)) return gradAppointmentPlaceholder;

  return ratedLine(
    instructorRateOf(context.pricingOfEmplid(lead.emplid), context.termRates),
    context.rateOverrides.personInputsByEmplid.get(lead.emplid),
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
  const { pricingOfEmplid, termRates } = context;
  const lectureSectionId = context.lectureSectionIdOf(ta.emplid, section);
  if (lectureSectionId !== null) {
    return {
      role: "ta",
      emplid: ta.emplid,
      ...paidOnLectureLine(lectureSectionId),
    };
  }
  if (context.isGradStudent(ta.emplid)) {
    return { role: "ta", emplid: ta.emplid, ...gradAppointmentPlaceholder };
  }

  return {
    role: "ta",
    emplid: ta.emplid,
    ...ratedLine(taRateOf(pricingOfEmplid(ta.emplid), termRates), undefined),
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

const personCourseKey = (emplid: number, courseCode: string) =>
  `${emplid}|${courseCode}`;

/** By `personCourseKey`: the first lecture each paid person is on. */
function lectureSectionIdByPersonCourseOf(
  sections: PlannedSection[],
): Map<string, number> {
  const lectures = sections
    .filter(({ component }) => component === LECTURE)
    .sort((a, b) => a.section.localeCompare(b.section));
  const lectureSectionIdByPersonCourse = new Map<string, number>();

  for (const lecture of lectures) {
    const paidPeople = [
      ...instructorsOfRecord(lecture.instructors),
      ...assistantsOf(lecture.instructors).filter(
        ({ role }) => role === TA_ROLE,
      ),
    ];
    for (const { emplid } of paidPeople) {
      const key = personCourseKey(emplid, lecture.courseCode);
      if (!lectureSectionIdByPersonCourse.has(key)) {
        lectureSectionIdByPersonCourse.set(key, lecture.id);
      }
    }
  }

  return lectureSectionIdByPersonCourse;
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
  assumptions: CostAssumptions;
}

function gradAppointmentsSplitAcrossSections(
  sections: PlannedSection[],
  linesBySectionId: Map<number, CostLine[]>,
  {
    gradTerm,
    pricingOfEmplid,
    isGradStudent,
    rateOverrides,
    assumptions,
  }: GradCharging,
): Map<number, CostLine[]> {
  const isGradAppointmentLine = (
    line: CostLine,
  ): line is CostLine & { emplid: number } =>
    line.emplid !== null &&
    line.basis.kind === "rate" &&
    isGradStudent(line.emplid);
  const sectionAppointmentsByEmplid = new Map<
    number,
    Map<number, SectionAppointment>
  >();
  const creditsByEmplid = new Map<number, number>();

  for (const section of sections) {
    for (const line of linesBySectionId.get(section.id) ?? []) {
      if (!isGradAppointmentLine(line)) continue;

      const { emplid } = line;
      const isTa = line.role === "ta";
      const assignment = section.instructors.find(
        (instructor) =>
          instructor.emplid === emplid &&
          (instructor.role === TA_ROLE) === isTa,
      );
      const percentWithoutOverride = appointmentPercentOfSection(
        section.component,
        isTa,
        defaultAppointmentOf(assumptions.gradRates),
      );
      sectionAppointmentsByEmplid.set(
        emplid,
        (sectionAppointmentsByEmplid.get(emplid) ?? new Map()).set(section.id, {
          percent: assignment?.appointmentPercent ?? percentWithoutOverride,
          percentWithoutOverride,
          isOverridden: assignment?.appointmentPercent != null,
        }),
      );
      if (!isTa) {
        creditsByEmplid.set(
          emplid,
          (creditsByEmplid.get(emplid) ?? 0) + (section.credits ?? 0),
        );
      }
    }
  }

  const percentsOf = (emplid: number) =>
    [...(sectionAppointmentsByEmplid.get(emplid)?.values() ?? [])].map(
      ({ percent }) => percent,
    );

  const appointmentOf = (emplid: number): GradAppointment => {
    const rate = pricingOfEmplid(emplid).rate;
    const setting = rateOverrides.gradPeopleByEmplid.get(emplid);
    const student: GradStudent = {
      appointmentPercent: sum(percentsOf(emplid)),
      isAbd: rate?.studentStatus === "abd",
      hasFeeOffset: setting?.hasFeeOffset ?? false,
      isInternational: setting?.isInternational ?? false,
      creditsTaught:
        rate?.instructorType === "graduate_instructor"
          ? (creditsByEmplid.get(emplid) ?? 0)
          : 0,
    };

    return {
      student,
      cost: gradCostOf(
        gradTerm,
        student,
        rateOverrides.personInputsByEmplid.get(emplid),
      ),
    };
  };

  return new Map(
    [...linesBySectionId].map(([sectionId, lines]) => [
      sectionId,
      lines.map((line): CostLine => {
        if (!isGradAppointmentLine(line)) return line;

        const appointment = appointmentOf(line.emplid);
        const sectionAppointment = sectionAppointmentsByEmplid
          .get(line.emplid)
          ?.get(sectionId);
        const { cost, student } = appointment;
        const share =
          student.appointmentPercent === 0 || sectionAppointment === undefined
            ? 0
            : sectionAppointment.percent / student.appointmentPercent;

        return {
          ...line,
          salary: cost ? cost.pay * share : null,
          fringe: cost ? cost.fringe * share : null,
          amount: cost ? cost.total * share : null,
          gradAppointment: appointment,
          sectionAppointment,
        };
      }),
    ]),
  );
}

const sum = (amounts: number[]) =>
  amounts.reduce((total, amount) => total + amount, 0);
