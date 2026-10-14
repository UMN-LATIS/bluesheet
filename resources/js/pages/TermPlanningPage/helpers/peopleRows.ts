import type { CostAssumptions, SisEmployee, TermLeave } from "@/types";
import type { PlannedSection } from "../types";
import type { RateOverrides } from "./costOverrides";
import {
  instructorRateOf,
  TA_APPOINTMENT_PERCENT,
  taRateOf,
  UNSTAFFED_JOB_CODE,
  unstaffedRateOf,
  type Rate,
} from "./costRules";
import { fundLabelOf } from "./rateRows";
import {
  pricingByEmplidOf,
  termRatesOf,
  type CostLine,
  type SectionCost,
} from "./termEstimate";

export interface PaidSection {
  sectionId: number;
  label: string;
  component: string;
}

export interface PersonRow {
  /** Null on the Unstaffed row. */
  emplid: number | null;
  name: string;
  jobCode: string;
  title: string;
  fundLabel: string;
  /**
   * Per paid section, or per course for a TA. Null when no
   * rate exists.
   */
  salary: number | null;
  /** Null when no rate exists. */
  salaryWithoutOverride: number | null;
  /** Only an instructor's salary can be overridden. */
  isSalaryOverridden: boolean;
  /** Per paid section or course. Null when no rate exists. */
  fringe: number | null;
  loadLabel: string;
  isUnderLoad: boolean;
  /** Lines with no rate add nothing. */
  total: number;
  hasMissingRate: boolean;
  paidSections: PaidSection[];
  notes: string;
  /** Leaves that overlap the term. */
  leaves: TermLeave[];
}

export interface PeopleTables {
  instructors: PersonRow[];
  tas: PersonRow[];
}

const TERMS_PER_YEAR = 2;

const UNPAID_BASIS_KINDS = [
  "freeComponent",
  "paidOnLecture",
  "chargedOnOtherSection",
];

const isPaid = ({ basis }: CostLine) =>
  !UNPAID_BASIS_KINDS.includes(basis.kind);

interface Charge {
  section: PlannedSection;
  line: CostLine;
}

const shortLabelOf = ({ catalogNumber, section }: PlannedSection) =>
  `${catalogNumber}-${section}`;

/**
 * Everyone charged this term, plus anyone on leave and
 * anyone on the roster whose job code expects a load.
 */
export function peopleTablesOf(
  sections: PlannedSection[],
  costsBySectionId: Map<number, SectionCost>,
  assumptions: CostAssumptions,
  rateOverrides: RateOverrides,
  roster: SisEmployee[],
  leavesByEmplid: Map<number, TermLeave[]>,
  notesByEmplid: Map<number, string>,
): PeopleTables {
  const pricingOfEmplid = pricingByEmplidOf(assumptions, rateOverrides);
  const termRates = termRatesOf(assumptions, rateOverrides);
  const positionTitlesByEmplid = new Map(
    assumptions.people.map((person) => [person.emplid, person.positionTitles]),
  );
  const rosterByEmplid = new Map(
    roster.map((employee) => [employee.emplid, employee]),
  );
  const chargesByEmplid = new Map<number, Charge[]>();
  const unstaffedCharges: Charge[] = [];

  for (const section of sections.filter(({ isCancelled }) => !isCancelled)) {
    for (const line of costsBySectionId.get(section.id)?.lines ?? []) {
      if (line.emplid === null) {
        unstaffedCharges.push({ section, line });
        continue;
      }

      const charges = chargesByEmplid.get(line.emplid) ?? [];
      charges.push({ section, line });
      chargesByEmplid.set(line.emplid, charges);
    }
  }

  const rowOf = (
    emplid: number,
    charges: Charge[],
  ): { isTa: boolean; sortName: string; row: PersonRow } => {
    const lines = charges.map(({ line }) => line);
    const pricing = pricingOfEmplid(emplid);
    const { jobCode, rate } = pricing;
    const isTa =
      lines.length > 0
        ? lines.every(({ role }) => role === "ta")
        : rate?.instructorType === "teaching_assistant";
    const leaves = leavesByEmplid.get(emplid) ?? [];
    const person =
      rosterByEmplid.get(emplid) ??
      charges
        .flatMap(({ section }) => section.instructors)
        .find((instructor) => instructor.emplid === emplid) ??
      leaves[0];
    const unitRate = isTa
      ? taRateOf(pricing, termRates)
      : instructorRateOf(pricing, termRates);
    const salaryOverride = isTa
      ? undefined
      : rateOverrides.salaryByEmplid.get(emplid);
    const paidCount = lines.filter(
      (line) => line.role === (isTa ? "ta" : "instructor") && isPaid(line),
    ).length;
    const expectedCount =
      rate?.annualLoad == null
        ? null
        : Math.ceil(rate.annualLoad / TERMS_PER_YEAR);

    const row: PersonRow = {
      emplid,
      name: nameOf(person),
      jobCode: jobCode ?? "—",
      title:
        rate?.title ??
        (jobCode && positionTitlesByEmplid.get(emplid)?.[jobCode]) ??
        "",
      fundLabel:
        isTa && !rate?.instructorType
          ? "TA/GI"
          : fundLabelOf(rate?.instructorType ?? null),
      ...unitPriceOf(unitRate, salaryOverride),
      loadLabel: isTa
        ? taLoadLabelOf(paidCount)
        : loadLabelOf(paidCount, expectedCount),
      isUnderLoad: isUnderLoadOf(isTa, leaves.length, paidCount, expectedCount),
      ...chargeSummaryOf(charges),
      notes: notesByEmplid.get(emplid) ?? "",
      leaves,
    };

    return { isTa, sortName: sortNameOf(person), row };
  };

  const hasExpectedLoad = ({ emplid }: SisEmployee) =>
    (pricingOfEmplid(emplid).rate?.annualLoad ?? 0) > 0;
  const idleEmplids = new Set([
    ...roster.filter(hasExpectedLoad).map(({ emplid }) => emplid),
    ...leavesByEmplid.keys(),
  ]);
  const rows = [
    ...[...chargesByEmplid].map(([emplid, charges]) => rowOf(emplid, charges)),
    ...[...idleEmplids]
      .filter((emplid) => !chargesByEmplid.has(emplid))
      .map((emplid) => rowOf(emplid, [])),
  ].sort((a, b) => a.sortName.localeCompare(b.sortName));
  const rowsWhere = (isTaWanted: boolean) =>
    rows.filter(({ isTa }) => isTa === isTaWanted).map(({ row }) => row);

  return {
    instructors: [
      ...rowsWhere(false),
      ...unstaffedRowsOf(unstaffedCharges, unstaffedRateOf(termRates)),
    ],
    tas: rowsWhere(true),
  };
}

interface NamedPerson {
  name: string | null;
  firstName?: string | null;
  lastName: string | null;
}

/** "Lastname, Firstname", or the single name the SIS sent when either part is missing. */
function nameOf(person: NamedPerson | undefined): string {
  if (person?.lastName && person.firstName) {
    return `${person.lastName}, ${person.firstName}`;
  }

  return person?.name ?? person?.lastName ?? "Unknown";
}

const sortNameOf = (person: NamedPerson | undefined): string =>
  person?.lastName ?? person?.name ?? "Unknown";

function isUnderLoadOf(
  isTa: boolean,
  leaveCount: number,
  paidCount: number,
  expectedCount: number | null,
): boolean {
  if (leaveCount > 0) return false;
  if (isTa) return paidCount === 0;

  return expectedCount !== null && paidCount < expectedCount;
}

function unitPriceOf(rate: Rate | null, salaryOverride: number | undefined) {
  const salaryWithoutOverride = rate?.salary ?? null;
  const salary = salaryOverride ?? salaryWithoutOverride;

  return {
    salary,
    salaryWithoutOverride,
    isSalaryOverridden: salaryOverride !== undefined,
    fringe: salary === null ? null : salary * (rate?.fringeRate ?? 0),
  };
}

function taLoadLabelOf(courseCount: number): string {
  const noun = courseCount === 1 ? "course" : "courses";

  return `${courseCount * TA_APPOINTMENT_PERCENT}% · ${courseCount} ${noun}`;
}

function unstaffedRowsOf(charges: Charge[], rate: Rate | null): PersonRow[] {
  const paidCount = charges.filter(({ line }) => isPaid(line)).length;
  if (paidCount === 0) return [];

  return [
    {
      emplid: null,
      name: "Unstaffed",
      jobCode: UNSTAFFED_JOB_CODE,
      title: "Unstaffed",
      fundLabel: "—",
      ...unitPriceOf(rate, undefined),
      loadLabel: String(paidCount),
      isUnderLoad: false,
      ...chargeSummaryOf(charges),
      notes: "",
      leaves: [],
    },
  ];
}

function chargeSummaryOf(charges: Charge[]) {
  const lines = charges.map(({ line }) => line);
  const paidSections = [
    ...new Set(
      charges.filter(({ line }) => isPaid(line)).map(({ section }) => section),
    ),
  ];

  return {
    total: lines.reduce((total, { amount }) => total + (amount ?? 0), 0),
    hasMissingRate: lines.some(({ amount }) => amount === null),
    paidSections: paidSections
      .map((section) => ({
        sectionId: section.id,
        label: shortLabelOf(section),
        component: section.component,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}

function loadLabelOf(paidCount: number, expectedCount: number | null): string {
  if (expectedCount === null) return String(paidCount);

  return `${paidCount} of ${expectedCount}`;
}
