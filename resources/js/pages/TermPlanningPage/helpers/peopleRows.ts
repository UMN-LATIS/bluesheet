import type { CostAssumptions, SisEmployee } from "@/types";
import type { PlannedSection } from "../types";
import type { RateOverrides } from "./costOverrides";
import {
  instructorRateOf,
  TA_APPOINTMENT_PERCENT,
  taAppointmentRateOf,
  UNSTAFFED_JOB_CODE,
  unstaffedRateOf,
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
}

export interface PersonRow {
  /** Null on the Unstaffed row. */
  emplid: number | null;
  name: string;
  jobCode: string;
  title: string;
  fundLabel: string;
  /** Per paid section. Null when no rate exists. */
  rate: number | null;
  /** Null when no rate exists. */
  rateWithoutOverride: number | null;
  isRateOverridden: boolean;
  loadLabel: string;
  isUnderLoad: boolean;
  /** Lines with no rate add nothing. */
  total: number;
  hasMissingRate: boolean;
  hasLineOverride: boolean;
  paidSections: PaidSection[];
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
 * Everyone charged this term, plus anyone on the roster
 * whose job code expects a load.
 */
export function peopleTablesOf(
  sections: PlannedSection[],
  costsBySectionId: Map<number, SectionCost>,
  assumptions: CostAssumptions,
  rateOverrides: RateOverrides,
  roster: SisEmployee[],
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
  ): { isTa: boolean; row: PersonRow } => {
    const lines = charges.map(({ line }) => line);
    const pricing = pricingOfEmplid(emplid);
    const { jobCode, rate } = pricing;
    const isTa = lines.length > 0 && lines.every(({ role }) => role === "ta");
    const person =
      rosterByEmplid.get(emplid) ??
      charges
        .flatMap(({ section }) => section.instructors)
        .find((instructor) => instructor.emplid === emplid);
    const rateWithoutOverride = isTa
      ? taAppointmentRateOf(pricing, termRates)
      : instructorRateOf(pricing, termRates);
    const personRate = rateOverrides.costPerSectionByEmplid.get(emplid);
    const paidCount = lines.filter(
      (line) => line.role === (isTa ? "ta" : "instructor") && isPaid(line),
    ).length;
    const expectedCount =
      rate?.annualLoad == null
        ? null
        : Math.ceil(rate.annualLoad / TERMS_PER_YEAR);

    const row: PersonRow = {
      emplid,
      name: person?.name ?? person?.lastName ?? "Unknown",
      jobCode: jobCode ?? "—",
      title:
        rate?.title ??
        (jobCode && positionTitlesByEmplid.get(emplid)?.[jobCode]) ??
        "",
      fundLabel:
        isTa && !rate?.instructorType
          ? "TA/GI"
          : fundLabelOf(rate?.instructorType ?? null),
      rate: personRate ?? rateWithoutOverride,
      rateWithoutOverride,
      isRateOverridden: personRate !== undefined,
      loadLabel: isTa
        ? `${paidCount * TA_APPOINTMENT_PERCENT}%`
        : loadLabelOf(paidCount, expectedCount),
      isUnderLoad: !isTa && expectedCount !== null && paidCount < expectedCount,
      ...chargeSummaryOf(charges),
    };

    return { isTa, row };
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
  ].sort((a, b) => a.row.name.localeCompare(b.row.name));
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

function unstaffedRowsOf(charges: Charge[], rate: number | null): PersonRow[] {
  const paidCount = charges.filter(({ line }) => isPaid(line)).length;
  if (paidCount === 0) return [];

  return [
    {
      emplid: null,
      name: "Unstaffed",
      jobCode: UNSTAFFED_JOB_CODE,
      title: "Unstaffed",
      fundLabel: "—",
      rate,
      rateWithoutOverride: rate,
      isRateOverridden: false,
      loadLabel: String(paidCount),
      isUnderLoad: false,
      ...chargeSummaryOf(charges),
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
    hasLineOverride: lines.some(({ basis }) => basis.kind === "lineOverride"),
    paidSections: paidSections
      .map((section) => ({
        sectionId: section.id,
        label: shortLabelOf(section),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}

function loadLabelOf(paidCount: number, expectedCount: number | null): string {
  if (expectedCount === null) return String(paidCount);

  return `${paidCount} of ${expectedCount}`;
}
