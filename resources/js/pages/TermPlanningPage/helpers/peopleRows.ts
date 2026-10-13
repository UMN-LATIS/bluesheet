import type { CostAssumptions, InstructorType, SisEmployee } from "@/types";
import type { PlannedSection } from "../types";
import { courseLabelOf } from "./budgetRows";
import { TA_APPOINTMENT_PERCENT } from "./costRules";
import {
  pricingByEmplidOf,
  type CostLine,
  type SectionCost,
} from "./termEstimate";

export type Fund = "recurring" | "ui" | "taGi" | "unlisted";

export interface SectionChip {
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
  sections: SectionChip[];
}

export interface PeopleGroup {
  fund: Fund;
  label: string;
  note: string;
  total: number;
  people: PersonRow[];
}

const GROUPS: Omit<PeopleGroup, "total" | "people">[] = [
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
    label: "Not in the job code list",
    note: "Costed at the Unstaffed rate",
  },
];

const FUND_OF_TYPE: Record<InstructorType, Fund> = {
  recurring_budget_faculty: "recurring",
  recurring_budget_pa: "recurring",
  contract_visiting: "ui",
  pa_instructor: "ui",
  graduate_instructor: "taGi",
  teaching_assistant: "taGi",
};

const UNPAID_SECTION_KINDS = [
  "freeComponent",
  "paidOnLecture",
  "chargedOnOtherSection",
];

/**
 * Everyone charged this term, plus anyone on the roster
 * whose job code expects a load. Empty groups are left out.
 */
export function peopleGroupsOf(
  sections: PlannedSection[],
  costsBySectionId: Map<number, SectionCost>,
  assumptions: CostAssumptions,
  roster: SisEmployee[],
  jobLabelOfEmplid: (emplid: number) => string,
): PeopleGroup[] {
  const pricingOfEmplid = pricingByEmplidOf(assumptions);
  const liveSections = sections.filter(({ isCancelled }) => !isCancelled);
  const linesByEmplid = new Map<number, CostLine[]>();
  const sectionsByEmplid = new Map<number, PlannedSection[]>();

  for (const section of liveSections) {
    for (const line of costsBySectionId.get(section.id)?.lines ?? []) {
      if (line.emplid === null) continue;

      linesByEmplid.set(line.emplid, [
        ...(linesByEmplid.get(line.emplid) ?? []),
        line,
      ]);
      if (!sectionsByEmplid.get(line.emplid)?.includes(section)) {
        sectionsByEmplid.set(line.emplid, [
          ...(sectionsByEmplid.get(line.emplid) ?? []),
          section,
        ]);
      }
    }
  }

  const rowOf = (emplid: number, lines: CostLine[]): PersonRow => {
    const { rate } = pricingOfEmplid(emplid);
    const isTa = lines.length > 0 && lines.every(({ role }) => role === "ta");
    const fund = rate?.instructorType
      ? FUND_OF_TYPE[rate.instructorType]
      : isTa
        ? "taGi"
        : "unlisted";
    const personSections = sectionsByEmplid.get(emplid) ?? [];
    const person =
      roster.find((employee) => employee.emplid === emplid) ??
      personSections
        .flatMap(({ instructors }) => instructors)
        .find((instructor) => instructor.emplid === emplid);
    const paidLineCount = lines.filter(
      ({ basis }) => !UNPAID_SECTION_KINDS.includes(basis.kind),
    ).length;
    const expected =
      rate?.annualLoad == null ? null : Math.ceil(rate.annualLoad / 2);

    return {
      fund,
      emplid,
      name: person?.name ?? person?.lastName ?? "Unknown",
      jobLabel: jobLabelOfEmplid(emplid),
      loadLabel: loadLabelOf(isTa, paidLineCount, expected),
      isUnderLoad: !isTa && expected !== null && paidLineCount < expected,
      cost: lines.reduce((total, { amount }) => total + (amount ?? 0), 0),
      hasMissingRate: lines.some(({ amount }) => amount === null),
      hasOverride: lines.some(({ basis }) => basis.kind === "lineOverride"),
      sections: personSections
        .map((section) => ({
          sectionId: section.id,
          label: courseLabelOf(section),
          component: section.component,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    };
  };

  const expectsLoad = ({ emplid }: SisEmployee) =>
    (pricingOfEmplid(emplid).rate?.annualLoad ?? 0) > 0;
  const idleRoster = roster.filter(
    (employee) => !linesByEmplid.has(employee.emplid) && expectsLoad(employee),
  );
  const rows = [
    ...[...linesByEmplid].map(([emplid, lines]) => rowOf(emplid, lines)),
    ...idleRoster.map(({ emplid }) => rowOf(emplid, [])),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return GROUPS.map((group) => {
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
  expected: number | null,
): string {
  if (isTa) return `${paidLineCount * TA_APPOINTMENT_PERCENT}% appointment`;
  if (expected === null) return String(paidLineCount);

  return `${paidLineCount} of ${expected}`;
}
