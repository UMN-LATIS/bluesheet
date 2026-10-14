import type {
  CostAssumptions,
  GradPerson,
  SisEmployee,
  TermLeave,
} from "@/types";
import type { PlannedSection } from "../types";
import type { RateOverrides } from "./costOverrides";
import {
  instructorRateOf,
  isGradJobCodeRate,
  taRateOf,
  UNSTAFFED_JOB_CODE,
  unstaffedRateOf,
  type Rate,
} from "./costRules";
import {
  gradReceiptOf,
  salaryReceiptOf,
  type ReceiptLine,
} from "./costReceipt";
import { defaultAppointmentOf } from "./gradCost";
import { formatWholeDollars } from "./money";
import { fundLabelOf } from "./rateRows";
import {
  pricingByEmplidOf,
  termRatesOf,
  type CostLine,
  type GradAppointment,
  type SectionCost,
} from "./termEstimate";

export interface SectionLink {
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
  /**
   * Per paid section, or per course for a TA. Null when no
   * rate exists.
   */
  salary: number | null;
  /** Null when no rate exists. */
  salaryWithoutOverride: number | null;
  /** Only a non-grad instructor's salary can be overridden. */
  isSalaryOverridden: boolean;
  /** A grad student's pay comes from the grad inputs on the Rates tab. */
  isSalaryReadOnly: boolean;
  /** Null when there is nothing to add to the salary. */
  salaryHint: string | null;
  /** Per paid section or course. Null when no rate exists. */
  fringe: number | null;
  loadLabel: string;
  isUnderLoad: boolean;
  /** Lines with no rate add nothing. */
  total: number;
  hasMissingRate: boolean;
  /**
   * The sections the person is paid on. A grad student's
   * other sections are included: the appointment is paid
   * once but they still work them.
   */
  sections: SectionLink[];
  notes: string;
  /** Leaves that overlap the term. */
  leaves: TermLeave[];
  /** Null unless the person's priced job code is a grad student's. */
  appointmentPercent: number | null;
  /** True when the person has their own appointment instead of the term's default. */
  isAppointmentOverridden: boolean;
  hasFeeOffset: boolean;
  isInternational: boolean;
  isAbd: boolean;
  receipt: ReceiptLine[];
}

/**
 * The edit that changes one of a grad student's settings and
 * keeps the others. Null on the Unstaffed row.
 */
export function gradPersonEditOf(
  row: PersonRow,
  change: Partial<Omit<GradPerson, "emplid">>,
): GradPerson | null {
  if (row.emplid === null) return null;

  const settings = {
    appointmentPercent: row.isAppointmentOverridden
      ? row.appointmentPercent
      : null,
    hasFeeOffset: row.hasFeeOffset,
    isInternational: row.isInternational,
    ...change,
  };

  return { emplid: row.emplid, ...settings };
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
  !UNPAID_BASIS_KINDS.includes(basis.kind) ||
  (basis.kind === "chargedOnOtherSection" &&
    basis.reason === "gradAppointment");

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
    const isGrad = isGradJobCodeRate(rate);
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
    const paidCount = lines.filter(
      (line) => line.role === (isTa ? "ta" : "instructor") && isPaid(line),
    ).length;
    const expectedCount =
      rate?.annualLoad == null
        ? null
        : Math.ceil(rate.annualLoad / TERMS_PER_YEAR);
    const gradSetting = rateOverrides.gradPeopleByEmplid.get(emplid);
    const appointmentPercent = isGrad
      ? (gradSetting?.appointmentPercent ?? defaultAppointmentOf(rateOverrides))
      : null;

    const price = isGrad
      ? gradPriceOf(lines)
      : unitPriceOf(
          isTa
            ? taRateOf(pricing, termRates)
            : instructorRateOf(pricing, termRates),
          isTa ? undefined : rateOverrides.salaryByEmplid.get(emplid),
        );
    const chargeSummary = chargeSummaryOf(charges);

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
      ...price,
      loadLabel:
        appointmentPercent !== null && isTa
          ? `${appointmentPercent}%`
          : loadLabelOf(paidCount, expectedCount),
      isUnderLoad: isUnderLoadOf(isTa, leaves.length, paidCount, expectedCount),
      ...chargeSummary,
      notes: notesByEmplid.get(emplid) ?? "",
      leaves,
      appointmentPercent,
      isAppointmentOverridden: gradSetting?.appointmentPercent != null,
      hasFeeOffset: isGrad && (gradSetting?.hasFeeOffset ?? false),
      isInternational: isGrad && (gradSetting?.isInternational ?? false),
      isAbd: rate?.studentStatus === "abd",
      receipt: receiptOf(lines, price, paidCount, chargeSummary.total),
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
    isSalaryReadOnly: false,
    salaryHint: null,
    fringe: salary === null ? null : salary * (rate?.fringeRate ?? 0),
  };
}

const gradAppointmentOf = (lines: CostLine[]) =>
  lines.find(({ gradAppointment }) => gradAppointment !== undefined)
    ?.gradAppointment;

function gradPriceOf(lines: CostLine[]) {
  const appointment = gradAppointmentOf(lines);

  return {
    salary: appointment?.cost?.pay ?? null,
    salaryWithoutOverride: null,
    isSalaryOverridden: false,
    isSalaryReadOnly: true,
    salaryHint: appointment === undefined ? null : gradHintOf(appointment),
    fringe: appointment?.cost?.fringe ?? null,
  };
}

function receiptOf(
  lines: CostLine[],
  price: { salary: number | null; fringe: number | null },
  paidCount: number,
  total: number,
): ReceiptLine[] {
  const appointment = gradAppointmentOf(lines);
  if (appointment?.cost) {
    return gradReceiptOf(appointment.student, appointment.cost);
  }

  return salaryReceiptOf({
    salaryPerSection: price.salary,
    fringePerSection: price.fringe,
    sectionCount: paidCount,
    total,
  });
}

function gradHintOf({ student, cost }: GradAppointment): string | null {
  if (student.creditsTaught > 0) {
    const credits = student.creditsTaught;
    const standing = student.isAbd ? " ABD" : "";

    return `${student.appointmentPercent}%${standing} · ${credits} ${credits === 1 ? "credit" : "credits"}`;
  }

  const offsets = (cost?.feeOffset ?? 0) + (cost?.internationalOffset ?? 0);

  return offsets > 0 ? `incl. ${formatWholeDollars(offsets)} offset` : null;
}

function unstaffedRowsOf(charges: Charge[], rate: Rate | null): PersonRow[] {
  const paidCount = charges.filter(({ line }) => isPaid(line)).length;
  if (paidCount === 0) return [];

  const price = unitPriceOf(rate, undefined);
  const chargeSummary = chargeSummaryOf(charges);

  return [
    {
      emplid: null,
      name: "Unstaffed",
      jobCode: UNSTAFFED_JOB_CODE,
      title: "Unstaffed",
      fundLabel: "—",
      ...price,
      loadLabel: String(paidCount),
      isUnderLoad: false,
      ...chargeSummary,
      notes: "",
      leaves: [],
      appointmentPercent: null,
      isAppointmentOverridden: false,
      hasFeeOffset: false,
      isInternational: false,
      isAbd: false,
      receipt: receiptOf([], price, paidCount, chargeSummary.total),
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
    sections: paidSections
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
