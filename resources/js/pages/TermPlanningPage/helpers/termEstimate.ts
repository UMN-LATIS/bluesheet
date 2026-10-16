import type { CostAssumptions, JobCodeRate } from "@/types";
import type { PlannedSection, SisInstructor } from "../types";
import type { CostBasis } from "./costBasis";
import type { CostInputs } from "./costOverrides";
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
import {
  sectionPayKeyOf,
  type SectionPayOverride,
} from "./sectionPayOverrides";
import { sumOf } from "./sumOf";
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
   * Present when this line bills part of a grad student's
   * appointment. The line's salary is that fraction of
   * `cost.pay`, its fringe that fraction of `cost.fringe`.
   */
  gradAppointment?: GradAppointment;
  /**
   * This section's part of a grad student's appointment.
   */
  sectionAppointment?: SectionAppointment;
  /** Present on the line of anyone but a grad student. */
  sectionSalary?: SectionSalary;
}

export interface SectionSalary {
  /** Null when the person has no rate. */
  salaryWithoutOverride: number | null;
  isSalaryOverridden: boolean;
  /**
   * A fraction of salary: 0.385 is 38.5%. Null when the
   * person has no rate.
   */
  fringeRate: number | null;
  fringeRateWithoutOverride: number | null;
  isFringeRateOverridden: boolean;
}

export interface GradAppointment {
  /**
   * The student. Their `appointmentPercent` is the sum of
   * `SectionAppointment.percent` over their sections.
   */
  student: GradStudent;
  /**
   * For the whole appointment. Null when the term has no
   * grad inputs or levels.
   */
  cost: GradCost | null;
}

export interface SectionAppointment {
  percent: number;
  /** The default for the person's role on this section. */
  percentWithoutOverride: number;
  /** True when a planner set the percent. */
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
  costInputs: CostInputs;
}

interface CostContext {
  pricingOfEmplid: (emplid: number) => PersonPricing;
  /**
   * The partner a crosslisted section is costed on, or
   * null.
   */
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
  ratesByJobCode: Map<string, JobCodeRate>;
  costInputs: CostInputs;
  isGradStudent: (emplid: number) => boolean;
}

/**
 * By section id. A cancelled section is present with no
 * lines.
 */
export function estimateTermCost(
  input: EstimateInput,
): Map<number, SectionCost> {
  const { sections, assumptions, costInputs } = input;
  const pricingOfEmplid = pricerOf(assumptions);
  const gradTerm = gradTermOf(assumptions);

  const uncancelledSections = sections.filter(
    ({ isCancelled }) => !isCancelled,
  );
  const crosslistOwnerByListing = blockOwners(uncancelledSections);
  const crosslistOwnerOf = (section: PlannedSection): number | null => {
    const listing = section.crosslist?.raw;
    if (listing === undefined) return null;

    return crosslistOwnerByListing.get(listing) ?? null;
  };

  const lectureSectionIdByPersonCourse =
    lectureSectionIdByPersonCourseOf(uncancelledSections);
  const lectureSectionIdOf = (
    emplid: number,
    { component, courseCode }: PlannedSection,
  ): number | null => {
    if (component === LECTURE) return null;

    return (
      lectureSectionIdByPersonCourse.get(personCourseKey(emplid, courseCode)) ??
      null
    );
  };
  const context: CostContext = {
    pricingOfEmplid,
    crosslistOwnerOf,
    lectureSectionIdOf,
    ratesByJobCode: ratesByJobCodeOf(assumptions),
    costInputs,
    isGradStudent: (emplid) => isGradJobCodeRate(pricingOfEmplid(emplid).rate),
  };
  const linesBySectionId = chargeOncePerMeetingTime(
    uncancelledSections,
    new Map(
      sections.map((section) => [section.id, costLinesOf(section, context)]),
    ),
  );
  const linesWithSectionSalaries = new Map(
    sections.map((section) => [
      section.id,
      (linesBySectionId.get(section.id) ?? []).map((line) =>
        withSectionSalary(line, section, context),
      ),
    ]),
  );
  const linesWithGradAppointments = linesWithGradAppointmentShares(
    uncancelledSections,
    linesWithSectionSalaries,
    {
      gradTerm,
      pricingOfEmplid,
      isGradStudent: context.isGradStudent,
      costInputs,
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

export function pricerOf(
  assumptions: CostAssumptions,
): (emplid: number) => PersonPricing {
  const ratesByJobCode = ratesByJobCodeOf(assumptions);
  const jobCodesByEmplid = new Map(
    assumptions.people.map((person) => [person.emplid, person.jobCodes]),
  );

  return (emplid) =>
    pricingOf(jobCodesByEmplid.get(emplid) ?? [], ratesByJobCode);
}

export const ratesByJobCodeOf = (assumptions: CostAssumptions) =>
  new Map<string, JobCodeRate>(
    assumptions.jobCodeRates.map((rate) => [rate.code, rate]),
  );

function costLinesOf(
  section: PlannedSection,
  context: CostContext,
): CostLine[] {
  return automaticCostLinesOf(section, context).map((line) =>
    withSectionPayOverride(line, section, context),
  );
}

function sectionPayOverrideOf(
  section: PlannedSection,
  emplid: number,
  costInputs: CostInputs,
): SectionPayOverride | undefined {
  return costInputs.sectionPayOverridesByKey.get(
    sectionPayKeyOf({
      courseCode: section.courseCode,
      section: section.section,
      emplid,
    }),
  );
}

function withSectionPayOverride(
  line: CostLine,
  section: PlannedSection,
  context: CostContext,
): CostLine {
  if (line.emplid === null) return line;

  const override = sectionPayOverrideOf(
    section,
    line.emplid,
    context.costInputs,
  );
  const plannerSetBasis: CostBasis = {
    kind: "plannerSet",
    automaticBasis: line.basis,
    automaticSalary: line.salary,
  };

  if (context.isGradStudent(line.emplid)) {
    if (override?.appointmentPercent == null) return line;

    return { ...line, ...NOTHING_OWED, basis: plannerSetBasis };
  }

  if (override?.salary == null) return line;

  const plannerSetLine = ratedLine(salaryRateOf(line, line.emplid, context), {
    salary: override.salary,
    fringeRate: personFringeRateOf(line, line.emplid, context),
  });

  return { ...line, ...plannerSetLine, basis: plannerSetBasis };
}

function salaryRateOf(
  { role }: CostLine,
  emplid: number,
  context: CostContext,
): Rate | null {
  const pricing = context.pricingOfEmplid(emplid);

  return role === "ta"
    ? taRateOf(pricing, context.ratesByJobCode)
    : instructorRateOf(pricing, context.ratesByJobCode);
}

function personFringeRateOf(
  line: CostLine,
  emplid: number,
  context: CostContext,
): number | null {
  const personInputs = context.costInputs.personInputsByEmplid.get(emplid);

  return (
    personInputs?.fringeRate ??
    salaryRateOf(line, emplid, context)?.fringeRate ??
    null
  );
}

const automaticSalaryOf = ({ basis, salary }: CostLine) =>
  basis.kind === "plannerSet" ? basis.automaticSalary : salary;

// Run before `chargeOncePerMeetingTime`, a line that rule
// zeroes keeps its rate as `salaryWithoutOverride`.
function withSectionSalary(
  line: CostLine,
  section: PlannedSection,
  context: CostContext,
): CostLine {
  if (line.emplid === null || context.isGradStudent(line.emplid)) return line;

  const plannerFringeRate =
    sectionPayOverrideOf(section, line.emplid, context.costInputs)
      ?.fringeRate ?? null;
  const fringeRateWithoutOverride = personFringeRateOf(
    line,
    line.emplid,
    context,
  );
  const sectionSalary: SectionSalary = {
    salaryWithoutOverride: automaticSalaryOf(line),
    isSalaryOverridden: line.basis.kind === "plannerSet",
    fringeRate: plannerFringeRate ?? fringeRateWithoutOverride,
    fringeRateWithoutOverride,
    isFringeRateOverridden: plannerFringeRate !== null,
  };

  if (plannerFringeRate === null || line.salary === null) {
    return { ...line, sectionSalary };
  }

  const fringe = line.salary * plannerFringeRate;

  return { ...line, fringe, amount: line.salary + fringe, sectionSalary };
}

function automaticCostLinesOf(
  section: PlannedSection,
  context: CostContext,
): CostLine[] {
  if (section.isCancelled) return [];

  const { ratesByJobCode } = context;
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
        ...ratedLine(unstaffedRateOf(ratesByJobCode), undefined),
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

  const fringeRate = overrides?.fringeRate ?? rate?.fringeRate ?? 0;
  const fringe = salary * fringeRate;

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
    instructorRateOf(
      context.pricingOfEmplid(lead.emplid),
      context.ratesByJobCode,
    ),
    context.costInputs.personInputsByEmplid.get(lead.emplid),
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
  const { pricingOfEmplid, ratesByJobCode } = context;
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
    ...ratedLine(
      taRateOf(pricingOfEmplid(ta.emplid), ratesByJobCode),
      undefined,
    ),
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
    instructorCost: sumOf(costs.map(({ instructorCost }) => instructorCost)),
    taCost: sumOf(costs.map(({ taCost }) => taCost)),
    total: sumOf(costs.map(({ total }) => total)),
    missingRateCount: lines.filter(({ amount }) => amount === null).length,
  };
}

function sectionCostOf(lines: CostLine[]): SectionCost {
  const amountOf = (roles: CostLine["role"][]) =>
    sumOf(
      lines
        .filter((line) => roles.includes(line.role))
        .map(({ amount }) => amount),
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

/**
 * By `personCourseKey`: the first lecture each paid person
 * is on.
 */
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

function chargeOncePerMeetingTime(
  sections: PlannedSection[],
  linesBySectionId: Map<number, CostLine[]>,
): Map<number, CostLine[]> {
  const paidSectionIdByPersonMeeting = new Map<string, number>();
  const chargedLinesBySectionId = new Map(linesBySectionId);

  for (const section of [...sections].sort(lecturesThenCourseAndSection)) {
    const meetingTimeKey = meetingTimeKeyOf(section);
    if (meetingTimeKey === null) continue;

    const lines = linesBySectionId.get(section.id) ?? [];
    chargedLinesBySectionId.set(
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

  return chargedLinesBySectionId;
}

const isPaidHere = (basis: CostBasis) =>
  basis.kind === "rate" || basis.kind === "plannerSet";

const automaticBasisOf = (basis: CostBasis): CostBasis =>
  basis.kind === "plannerSet" ? basis.automaticBasis : basis;

const NOT_APPOINTED_HERE: SectionAppointment = {
  percent: 0,
  percentWithoutOverride: 0,
  isOverridden: false,
};

interface GradCharging {
  gradTerm: GradTerm | null;
  pricingOfEmplid: (emplid: number) => PersonPricing;
  isGradStudent: (emplid: number) => boolean;
  costInputs: CostInputs;
  assumptions: CostAssumptions;
}

function linesWithGradAppointmentShares(
  sections: PlannedSection[],
  linesBySectionId: Map<number, CostLine[]>,
  {
    gradTerm,
    pricingOfEmplid,
    isGradStudent,
    costInputs,
    assumptions,
  }: GradCharging,
): Map<number, CostLine[]> {
  const isGradLine = (line: CostLine): line is CostLine & { emplid: number } =>
    line.emplid !== null && isGradStudent(line.emplid);
  const isGradAppointmentLine = (
    line: CostLine,
  ): line is CostLine & { emplid: number } =>
    isGradLine(line) && isPaidHere(line.basis);

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
      const plannerPercent =
        sectionPayOverrideOf(section, emplid, costInputs)?.appointmentPercent ??
        null;
      const percentWithoutOverride = isPaidHere(automaticBasisOf(line.basis))
        ? appointmentPercentOfSection(
            section.component,
            isTa,
            defaultAppointmentOf(assumptions.gradRates),
          )
        : 0;
      const sectionAppointments =
        sectionAppointmentsByEmplid.get(emplid) ??
        new Map<number, SectionAppointment>();
      sectionAppointments.set(section.id, {
        percent: plannerPercent ?? percentWithoutOverride,
        percentWithoutOverride,
        isOverridden: plannerPercent !== null,
      });
      sectionAppointmentsByEmplid.set(emplid, sectionAppointments);
      if (!isTa) {
        creditsByEmplid.set(
          emplid,
          (creditsByEmplid.get(emplid) ?? 0) + (section.credits ?? 0),
        );
      }
    }
  }

  const percentsOf = (emplid: number): number[] => {
    const sectionAppointments = sectionAppointmentsByEmplid.get(emplid);
    if (sectionAppointments === undefined) return [];

    return [...sectionAppointments.values()].map(({ percent }) => percent);
  };

  const appointmentOf = (emplid: number): GradAppointment => {
    const rate = pricingOfEmplid(emplid).rate;
    const setting = costInputs.gradPeopleByEmplid.get(emplid);
    const student: GradStudent = {
      appointmentPercent: sumOf(percentsOf(emplid)),
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
        costInputs.personInputsByEmplid.get(emplid),
      ),
    };
  };

  return new Map(
    [...linesBySectionId].map(([sectionId, lines]) => [
      sectionId,
      lines.map((line): CostLine => {
        if (!isGradLine(line)) return line;
        if (!isPaidHere(line.basis)) {
          return { ...line, sectionAppointment: NOT_APPOINTED_HERE };
        }

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
