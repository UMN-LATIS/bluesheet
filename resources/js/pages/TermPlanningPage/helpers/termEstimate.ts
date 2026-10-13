import type { CostAssumptions, JobCodeRate } from "@/types";
import type { PlannedSection, SisInstructor } from "../types";
import type { CostBasis } from "./costBasis";
import {
  lineOverrideKeyOf,
  type LineOverride,
  type RateOverrides,
} from "./costOverrides";
import {
  costOfLeadInstructor,
  costOfTaAppointment,
  costOfUnstaffedSection,
  isFreeComponent,
  pricingOf,
  type PersonPricing,
  type PricedLine,
  type TermRates,
} from "./costRules";
import { blockOwners } from "./sectionPlacement";
import { assistantsOf, instructorsOfRecord, TA_ROLE } from "./sectionPeople";

const LECTURE = "LEC";

export interface CostLine {
  role: "instructor" | "ta" | "unstaffedSection";
  /** Null on the unstaffed line, which names no one. */
  emplid: number | null;
  /** Null when no rate exists. */
  amount: number | null;
  basis: CostBasis;
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
  lineOverridesByKey: Map<string, LineOverride>;
}

interface CostContext {
  pricingOfEmplid: (emplid: number) => PersonPricing;
  /** The partner a crosslisted section is costed on, or null. */
  crosslistOwnerOf: (section: PlannedSection) => number | null;
  chargedSectionIdByTaCourse: Map<string, number>;
  /** Null when the course has no live lecture. */
  lectureSectionIdOf: (section: PlannedSection) => number | null;
  termRates: TermRates;
}

/**
 * By section id. A cancelled section is present with no
 * lines.
 */
export function estimateTermCost(
  input: EstimateInput,
): Map<number, SectionCost> {
  const { sections, assumptions, rateOverrides, lineOverridesByKey } = input;
  const pricingOfEmplid = pricingByEmplidOf(assumptions);

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
    termRates: {
      ratesByJobCode: ratesByJobCodeOf(assumptions),
      overrides: rateOverrides,
      season: assumptions.season,
      taRates: assumptions.taRates.rates,
      taRateFiscalYear: assumptions.taRates.fiscalYear,
    },
  };
  const withLineOverride = (
    { courseCode, section }: PlannedSection,
    line: CostLine,
  ): CostLine => {
    if (line.emplid === null || !isOverridable(line)) return line;

    const override = lineOverridesByKey.get(
      lineOverrideKeyOf(courseCode, section, line.emplid),
    );

    return override ? overriddenLine(line, override) : line;
  };

  return new Map(
    sections.map((section) => [
      section.id,
      sectionCostOf(
        costLinesOf(section, context).map((line) =>
          withLineOverride(section, line),
        ),
      ),
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

const ratesByJobCodeOf = (assumptions: CostAssumptions) =>
  new Map<string, JobCodeRate>(
    assumptions.jobCodes.map((rate) => [rate.code, rate]),
  );

const isOverridable = ({ basis }: CostLine) =>
  basis.kind !== "chargedOnOtherSection";

function overriddenLine(line: CostLine, override: LineOverride): CostLine {
  return {
    ...line,
    amount: override.amount,
    basis: {
      kind: "lineOverride",
      reason: override.reason,
      replacedAmount: line.amount,
    },
  };
}

function costLinesOf(
  section: PlannedSection,
  context: CostContext,
): CostLine[] {
  if (section.isCancelled) return [];

  const { pricingOfEmplid, termRates } = context;
  const leads = instructorsOfRecord(section.instructors);
  const tas = assistantsOf(section.instructors).filter(
    ({ role }) => role === TA_ROLE,
  );

  const crosslistOwnerId = context.crosslistOwnerOf(section);
  if (crosslistOwnerId !== null && crosslistOwnerId !== section.id) {
    return crosslistPartnerLines(crosslistOwnerId, [...leads, ...tas]);
  }

  if (isFreeComponent(section.component)) {
    return freeComponentLines(section.component, [...leads, ...tas]);
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
          ? paidOnLectureLine(section.component, lectureSectionId)
          : costOfUnstaffedSection(termRates)),
      },
    ];
  }

  const leadLines = leads.map(
    (lead): CostLine => ({
      role: "instructor",
      emplid: lead.emplid,
      ...(isPaidOnLecture
        ? paidOnLectureLine(section.component, lectureSectionId)
        : costOfLeadInstructor(pricingOfEmplid(lead.emplid), termRates)),
    }),
  );
  const taLines = tas.map((ta) => taLineOf(ta, section, context));

  return [...leadLines, ...taLines];
}

function paidOnLectureLine(
  component: string,
  lectureSectionId: number,
): PricedLine {
  return {
    amount: 0,
    basis: { kind: "paidOnLecture", component, lectureSectionId },
  };
}

function taLineOf(
  ta: SisInstructor,
  section: PlannedSection,
  context: CostContext,
): CostLine {
  const { pricingOfEmplid, chargedSectionIdByTaCourse, termRates } = context;
  const chargedSectionId =
    chargedSectionIdByTaCourse.get(
      taCourseKey(ta.emplid, section.courseCode),
    ) ?? section.id;

  if (chargedSectionId !== section.id) {
    return {
      role: "ta",
      emplid: ta.emplid,
      amount: 0,
      basis: { kind: "chargedOnOtherSection", sectionId: chargedSectionId },
    };
  }

  return {
    role: "ta",
    emplid: ta.emplid,
    ...costOfTaAppointment(pricingOfEmplid(ta.emplid), termRates),
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
  };

  if (people.length === 0) {
    return [{ role: "unstaffedSection", emplid: null, amount: 0, basis }];
  }

  return people.map((person) => ({
    role: person.role === TA_ROLE ? "ta" : "instructor",
    emplid: person.emplid,
    amount: 0,
    basis,
  }));
}

function freeComponentLines(
  component: string,
  people: SisInstructor[],
): CostLine[] {
  const basis: CostBasis = { kind: "freeComponent", component };

  if (people.length === 0) {
    return [{ role: "unstaffedSection", emplid: null, amount: 0, basis }];
  }

  return people.map((person) => ({
    role: person.role === TA_ROLE ? "ta" : "instructor",
    emplid: person.emplid,
    amount: 0,
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
  const byPreference = [...sections].sort(lecturesThenSectionNumber);
  const charged = new Map<string, number>();

  for (const section of byPreference) {
    for (const { emplid, role } of section.instructors) {
      const key = taCourseKey(emplid, section.courseCode);
      if (role === TA_ROLE && !charged.has(key)) charged.set(key, section.id);
    }
  }

  return charged;
}

function lecturesThenSectionNumber(
  a: PlannedSection,
  b: PlannedSection,
): number {
  const isLecture = (section: PlannedSection) => section.component === LECTURE;
  if (isLecture(a) !== isLecture(b)) return isLecture(a) ? -1 : 1;

  return a.section.localeCompare(b.section);
}

const sum = (amounts: number[]) =>
  amounts.reduce((total, amount) => total + amount, 0);
