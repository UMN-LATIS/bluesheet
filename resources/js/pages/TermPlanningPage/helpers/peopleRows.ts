import type {
  CostAssumptions,
  InstructorType,
  JobCodeRate,
  SisEmployee,
} from "@/types";
import type { PlannedSection } from "../types";
import { courseLabelOf } from "./budgetRows";
import { TA_APPOINTMENT_PERCENT } from "./costRules";
import {
  pricingByEmplidOf,
  type CostLine,
  type SectionCost,
} from "./termEstimate";

export type Fund = "recurring" | "ui" | "taGi" | "unlisted";

export interface PaidSection {
  sectionId: number;
  label: string;
  component: string;
}

export interface PersonRow {
  emplid: number;
  fund: Fund;
  name: string;
  jobLabel: string;
  loadLabel: string;
  isUnderLoad: boolean;
  /** Lines with no rate add nothing. */
  cost: number;
  hasMissingRate: boolean;
  hasOverride: boolean;
  paidSections: PaidSection[];
  /**
   * Sections with a line for this person but no paid line,
   * such as a lab paid on its lecture.
   */
  unpaidSectionCount: number;
}

export interface FundGroup {
  fund: Fund;
  label: string;
  note: string;
  total: number;
  people: PersonRow[];
}

const FUND_GROUPS: Omit<FundGroup, "total" | "people">[] = [
  {
    fund: "recurring",
    label: "Base budget",
    note: "Recurring faculty and P&A",
  },
  { fund: "ui", label: "UI allocation", note: "P&A and contract instructors" },
  {
    fund: "taGi",
    label: "TA/GI allocation",
    note: "Graduate instructors and TAs",
  },
  {
    fund: "unlisted",
    label: "Job code not in Nova",
    note: "Costed at the Unstaffed rate unless the Rates tab sets one",
  },
];

const TERMS_PER_YEAR = 2;

const FUND_OF_TYPE: Record<InstructorType, Fund> = {
  recurring_budget_faculty: "recurring",
  recurring_budget_pa: "recurring",
  contract_visiting: "ui",
  pa_instructor: "ui",
  graduate_instructor: "taGi",
  teaching_assistant: "taGi",
};

const UNPAID_BASIS_KINDS = [
  "freeComponent",
  "paidOnLecture",
  "chargedOnOtherSection",
];

const isPaid = ({ basis }: CostLine) =>
  !UNPAID_BASIS_KINDS.includes(basis.kind);

function fundOf(rate: JobCodeRate | null, isTa: boolean): Fund {
  if (rate?.instructorType) return FUND_OF_TYPE[rate.instructorType];
  if (isTa) return "taGi";

  return "unlisted";
}

interface Charge {
  section: PlannedSection;
  line: CostLine;
}

/**
 * Everyone charged this term, plus anyone on the roster
 * whose job code expects a load. Empty groups are left out.
 */
export function fundGroupsOf(
  sections: PlannedSection[],
  costsBySectionId: Map<number, SectionCost>,
  assumptions: CostAssumptions,
  roster: SisEmployee[],
  jobLabelOfEmplid: (emplid: number) => string,
): FundGroup[] {
  const pricingOfEmplid = pricingByEmplidOf(assumptions);
  const liveSections = sections.filter(({ isCancelled }) => !isCancelled);
  const chargesByEmplid = new Map<number, Charge[]>();

  for (const section of liveSections) {
    for (const line of costsBySectionId.get(section.id)?.lines ?? []) {
      if (line.emplid === null) continue;

      chargesByEmplid.set(line.emplid, [
        ...(chargesByEmplid.get(line.emplid) ?? []),
        { section, line },
      ]);
    }
  }

  const rowOf = (emplid: number, charges: Charge[]): PersonRow => {
    const lines = charges.map(({ line }) => line);
    const { rate } = pricingOfEmplid(emplid);
    const isTa = lines.length > 0 && lines.every(({ role }) => role === "ta");
    const fund = fundOf(rate, isTa);
    const person =
      roster.find((employee) => employee.emplid === emplid) ??
      charges
        .flatMap(({ section }) => section.instructors)
        .find((instructor) => instructor.emplid === emplid);
    const paidSections = [
      ...new Set(
        charges
          .filter(({ line }) => isPaid(line))
          .map(({ section }) => section),
      ),
    ];
    const allSections = new Set(charges.map(({ section }) => section));
    const paidLineCount = lines.filter(isPaid).length;
    const expectedSectionCount =
      rate?.annualLoad == null
        ? null
        : Math.ceil(rate.annualLoad / TERMS_PER_YEAR);

    return {
      fund,
      emplid,
      name: person?.name ?? person?.lastName ?? "Unknown",
      jobLabel: jobLabelOfEmplid(emplid),
      loadLabel: loadLabelOf(isTa, paidLineCount, expectedSectionCount),
      isUnderLoad:
        !isTa &&
        expectedSectionCount !== null &&
        paidLineCount < expectedSectionCount,
      cost: lines.reduce((total, { amount }) => total + (amount ?? 0), 0),
      hasMissingRate: lines.some(({ amount }) => amount === null),
      hasOverride: lines.some(({ basis }) => basis.kind === "lineOverride"),
      paidSections: paidSections
        .map((section) => ({
          sectionId: section.id,
          label: courseLabelOf(section),
          component: section.component,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      unpaidSectionCount: allSections.size - paidSections.length,
    };
  };

  const hasExpectedLoad = ({ emplid }: SisEmployee) =>
    (pricingOfEmplid(emplid).rate?.annualLoad ?? 0) > 0;
  const idleRoster = roster.filter(
    (employee) =>
      !chargesByEmplid.has(employee.emplid) && hasExpectedLoad(employee),
  );
  const rows = [
    ...[...chargesByEmplid].map(([emplid, charges]) => rowOf(emplid, charges)),
    ...idleRoster.map(({ emplid }) => rowOf(emplid, [])),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return FUND_GROUPS.map((group) => {
    const people = rows.filter(({ fund }) => fund === group.fund);

    return {
      ...group,
      people,
      total: people.reduce((total, { cost }) => total + cost, 0),
    };
  }).filter(({ people }) => people.length > 0);
}

function loadLabelOf(
  isTa: boolean,
  paidLineCount: number,
  expectedSectionCount: number | null,
): string {
  if (isTa) return `${paidLineCount * TA_APPOINTMENT_PERCENT}% appointment`;
  if (expectedSectionCount === null) return String(paidLineCount);

  return `${paidLineCount} of ${expectedSectionCount}`;
}
