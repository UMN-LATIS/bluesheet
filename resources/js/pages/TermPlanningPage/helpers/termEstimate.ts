import type { CostAssumptions, JobCodeRate } from "@/types";
import type { PlannedSection, SisInstructor } from "../types";
import type { CostBasis } from "./costBasis";
import {
  costOfLeadInstructor,
  costOfTaAppointment,
  type CostRuleSettings,
  isFreeComponent,
  pricingOf,
  type PersonPricing,
  type PricedLine,
} from "./costRules";
import { blockOwners } from "./sectionPlacement";
import { assistantsOf, instructorsOfRecord, TA_ROLE } from "./sectionPeople";

export interface CostLine {
  role: "instructor" | "ta" | "unstaffedSection";
  /** Null on the unstaffed line, which names no one. */
  emplid: number | null;
  /**
   * Null when no rate exists and no setting stands in for
   * one.
   */
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
  settings: CostRuleSettings;
}

interface CostContext {
  pricingOfEmplid: (emplid: number) => PersonPricing;
  /** The partner a crosslisted section is costed on, or null. */
  crosslistOwnerOf: (section: PlannedSection) => number | null;
  chargedSectionIdByTaCourse: Map<string, number>;
  hasLiveLecture: (section: PlannedSection) => boolean;
  assumptions: CostAssumptions;
  settings: CostRuleSettings;
}

/**
 * By section id. A cancelled section is present with no
 * lines.
 */
export function estimateTermCost(
  input: EstimateInput,
): Map<number, SectionCost> {
  const { sections, assumptions, settings } = input;
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
    (section) =>
      isCostedHere(section) && !isFreeComponent(section.component, settings),
  );
  const courseCodesWithLiveLecture = new Set(
    liveSections
      .filter(({ component }) => component === "LEC")
      .map(({ courseCode }) => courseCode),
  );
  const context: CostContext = {
    pricingOfEmplid,
    crosslistOwnerOf,
    hasLiveLecture: ({ courseCode }) =>
      courseCodesWithLiveLecture.has(courseCode),
    chargedSectionIdByTaCourse: chargedSectionIdByTaCourseOf(
      sectionsThatCanChargeATa,
    ),
    assumptions,
    settings,
  };

  return new Map(
    sections.map((section) => [
      section.id,
      sectionCostOf(costLinesOf(section, context)),
    ]),
  );
}

export function pricingByEmplidOf(
  assumptions: CostAssumptions,
): (emplid: number) => PersonPricing {
  const ratesByJobCode = new Map<string, JobCodeRate>(
    assumptions.jobCodes.map((rate) => [rate.code, rate]),
  );
  const jobCodesByEmplid = new Map(
    assumptions.people.map((person) => [person.emplid, person.jobCodes]),
  );
  const personChoices = new Map(
    assumptions.personChoices.map((choice) => [choice.emplid, choice]),
  );

  return (emplid) =>
    pricingOf(
      jobCodesByEmplid.get(emplid) ?? [],
      personChoices.get(emplid),
      ratesByJobCode,
    );
}

function costLinesOf(
  section: PlannedSection,
  context: CostContext,
): CostLine[] {
  if (section.isCancelled) return [];

  const { pricingOfEmplid, settings } = context;
  const leads = instructorsOfRecord(section.instructors);
  const tas = assistantsOf(section.instructors).filter(
    ({ role }) => role === TA_ROLE,
  );

  const crosslistOwnerId = context.crosslistOwnerOf(section);
  if (crosslistOwnerId !== null && crosslistOwnerId !== section.id) {
    return crosslistPartnerLines(crosslistOwnerId, [...leads, ...tas]);
  }

  if (isFreeComponent(section.component, settings)) {
    return freeComponentLines(section.component, [...leads, ...tas]);
  }

  const paidOnLecture: PricedLine | null =
    PAID_ON_LECTURE_COMPONENTS.includes(section.component) &&
    context.hasLiveLecture(section)
      ? {
          amount: 0,
          basis: { kind: "paidOnLecture", component: section.component },
        }
      : null;

  if (leads.length === 0 && tas.length === 0) {
    return [
      {
        role: "unstaffedSection",
        emplid: null,
        ...(paidOnLecture ?? {
          amount: settings.unstaffedSectionCost,
          basis: { kind: "unstaffedSection" },
        }),
      },
    ];
  }

  const leadLines = leads.map(
    (lead): CostLine => ({
      role: "instructor",
      emplid: lead.emplid,
      ...(paidOnLecture ??
        costOfLeadInstructor(pricingOfEmplid(lead.emplid), settings)),
    }),
  );
  const taLines = tas.map((ta) => taLineOf(ta, section, context));

  return [...leadLines, ...taLines];
}

function taLineOf(
  ta: SisInstructor,
  section: PlannedSection,
  context: CostContext,
): CostLine {
  const { pricingOfEmplid, chargedSectionIdByTaCourse, assumptions, settings } =
    context;
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
    ...costOfTaAppointment(
      pricingOfEmplid(ta.emplid),
      settings,
      assumptions.season,
      assumptions.taRates.rates,
      assumptions.taRates.fiscalYear,
    ),
  };
}

export interface CostTotals {
  instructorCost: number;
  taCost: number;
  total: number;
  /** Lines with no rate add nothing to the totals. */
  missingRateCount: number;
  /** People with an override on a counted line. */
  overrideCount: number;
  recurringBudgetSectionCount: number;
}

export function totalsOf(costs: SectionCost[]): CostTotals {
  const lines = costs.flatMap(({ lines }) => lines);
  const overriddenEmplids = new Set(
    lines
      .filter(({ basis }) => basis.kind === "override")
      .map(({ emplid }) => emplid),
  );
  const isRecurringBudgetSection = (cost: SectionCost) =>
    cost.lines.some(({ basis }) => basis.kind === "recurringBudget");

  return {
    instructorCost: sum(costs.map(({ instructorCost }) => instructorCost)),
    taCost: sum(costs.map(({ taCost }) => taCost)),
    total: sum(costs.map(({ total }) => total)),
    missingRateCount: lines.filter(({ amount }) => amount === null).length,
    overrideCount: overriddenEmplids.size,
    recurringBudgetSectionCount: costs.filter(isRecurringBudgetSection).length,
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

const PAID_ON_LECTURE_COMPONENTS = ["LAB", "DIS"];

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
  const isLecture = (section: PlannedSection) => section.component === "LEC";
  if (isLecture(a) !== isLecture(b)) return isLecture(a) ? -1 : 1;

  return a.section.localeCompare(b.section);
}

const sum = (amounts: number[]) =>
  amounts.reduce((total, amount) => total + amount, 0);
