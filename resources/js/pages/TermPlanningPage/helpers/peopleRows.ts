import type {
  CostAssumptions,
  GradPerson,
  InstructorType,
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
  type ReceiptFigure,
  type ReceiptLine,
  type TaWork,
} from "./costReceipt";
import { formatWholeDollars } from "./money";
import { fundLabelOf } from "./fundLabel";
import { jobLabelOf } from "./jobLabel";
import type { PersonInputs } from "./personInputs";
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
  /** "9517 · Ph D Candidate Grad Instructor", or the job code alone when it has no title. */
  jobLabel: string;
  /** Null when the person's job code is not in the catalog. */
  instructorType: InstructorType | null;
  fundLabel: string;
  /**
   * Per paid section, or per course for a TA. Null when no
   * rate exists.
   */
  salary: number | null;
  /** Only a non-grad instructor's salary can be overridden. */
  isSalaryOverridden: boolean;
  /** Null when there is nothing to add to the salary. */
  salaryHint: string | null;
  /** Per paid section or course. Null when no rate exists. */
  fringe: number | null;
  /** This term's salary, over every paid section. Lines with no rate add nothing. */
  termSalary: number;
  /** This term's fringe, over every paid section. Lines with no rate add nothing. */
  termFringe: number;
  /** Paid sections, or a grad student's appointment percent. */
  loadLabel: string;
  /** Sections paid this term, in the role the person is costed in. */
  paidSectionCount: number;
  courseReleases: number | null;
  releaseSource: string | null;
  yearStarted: number | null;
  /** Lines with no rate add nothing. */
  total: number;
  hasMissingRate: boolean;
  /** The sections the person is paid on. */
  sections: SectionLink[];
  /** False when the person is on no section this term. */
  isAssigned: boolean;
  notes: string;
  /** Leaves that overlap the term. */
  leaves: TermLeave[];
  isGrad: boolean;
  /** The sum of their sections' parts. Null unless a grad student. */
  appointmentPercent: number | null;
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
    hasFeeOffset: row.hasFeeOffset,
    isInternational: row.isInternational,
    ...change,
  };

  return { emplid: row.emplid, ...settings };
}

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
export function peopleRowsOf(
  sections: PlannedSection[],
  costsBySectionId: Map<number, SectionCost>,
  assumptions: CostAssumptions,
  rateOverrides: RateOverrides,
  roster: SisEmployee[],
  leavesByEmplid: Map<number, TermLeave[]>,
): PersonRow[] {
  const pricingOfEmplid = pricingByEmplidOf(assumptions);
  const termRates = termRatesOf(assumptions);
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
  ): { sortName: string; row: PersonRow } => {
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
    const paidTaCount = lines.filter(
      (line) => line.role === "ta" && isPaid(line),
    ).length;
    const taWork: TaWork | undefined =
      !isGrad && !isTa && paidTaCount > 0
        ? {
            ...unitFiguresOf(taRateOf(pricing, termRates), undefined),
            courseCount: paidTaCount,
          }
        : undefined;
    const inputs = rateOverrides.personInputsByEmplid.get(emplid);
    const courseReleases = inputs?.courseReleases ?? null;
    const gradSetting = rateOverrides.gradPeopleByEmplid.get(emplid);
    const appointmentPercent = isGrad
      ? (gradAppointmentOf(lines)?.student.appointmentPercent ?? 0)
      : null;

    const unitFigures = unitFiguresOf(
      isTa
        ? taRateOf(pricing, termRates)
        : instructorRateOf(pricing, termRates),
      isTa ? undefined : rateOverrides.personInputsByEmplid.get(emplid),
    );
    const price = isGrad ? gradPriceOf(lines) : unitPriceOf(unitFigures);
    const chargeSummary = chargeSummaryOf(charges);
    const title =
      rate?.title ??
      (jobCode && positionTitlesByEmplid.get(emplid)?.[jobCode]) ??
      "";

    const row: PersonRow = {
      emplid,
      name: nameOf(person),
      jobCode: jobCode ?? "—",
      title,
      jobLabel: jobCode ? jobLabelOf(jobCode, title) : "—",
      instructorType: rate?.instructorType ?? null,
      fundLabel:
        isTa && !rate?.instructorType
          ? "TA/GI"
          : fundLabelOf(rate?.instructorType ?? null),
      ...price,
      termSalary: sumOf(lines.map(({ salary }) => salary)),
      termFringe: sumOf(lines.map(({ fringe }) => fringe)),
      loadLabel:
        appointmentPercent === null
          ? String(paidCount)
          : `${appointmentPercent}%`,
      paidSectionCount: paidCount,
      courseReleases,
      releaseSource: inputs?.releaseSource ?? null,
      yearStarted: inputs?.yearStarted ?? null,
      ...chargeSummary,
      isAssigned: charges.length > 0,
      notes: inputs?.notes ?? "",
      leaves,
      isGrad,
      appointmentPercent,
      hasFeeOffset: isGrad && (gradSetting?.hasFeeOffset ?? false),
      isInternational: isGrad && (gradSetting?.isInternational ?? false),
      isAbd: rate?.studentStatus === "abd",
      receipt: receiptOf({
        lines,
        unitFigures,
        paidCount,
        total: chargeSummary.total,
        isEditable: isGrad || !isTa,
        taWork,
      }),
    };

    return { sortName: sortNameOf(person), row };
  };

  const hasInstructorType = ({ emplid }: SisEmployee) =>
    pricingOfEmplid(emplid).rate?.instructorType != null;
  const idleEmplids = new Set([
    ...roster.filter(hasInstructorType).map(({ emplid }) => emplid),
    ...leavesByEmplid.keys(),
  ]);
  const rows = [
    ...[...chargesByEmplid].map(([emplid, charges]) => rowOf(emplid, charges)),
    ...[...idleEmplids]
      .filter((emplid) => !chargesByEmplid.has(emplid))
      .map((emplid) => rowOf(emplid, [])),
  ].sort((a, b) => a.sortName.localeCompare(b.sortName));

  return [
    ...rows.map(({ row }) => row),
    ...unstaffedRowsOf(unstaffedCharges, unstaffedRateOf(termRates)),
  ];
}

const sumOf = (amounts: (number | null)[]) =>
  amounts.reduce<number>((total, amount) => total + (amount ?? 0), 0);

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

interface UnitFigures {
  salary: ReceiptFigure;
  fringeRate: ReceiptFigure;
}

function unitFiguresOf(
  rate: Rate | null,
  overrides: Pick<PersonInputs, "salary" | "fringeRate"> | undefined,
): UnitFigures {
  const salaryWithoutOverride = rate?.salary ?? null;
  const fringeRateWithoutOverride = rate?.fringeRate ?? 0;

  return {
    salary: {
      value: overrides?.salary ?? salaryWithoutOverride,
      valueWithoutOverride: salaryWithoutOverride,
    },
    fringeRate: {
      value: overrides?.fringeRate ?? fringeRateWithoutOverride,
      valueWithoutOverride: fringeRateWithoutOverride,
    },
  };
}

function unitPriceOf({ salary, fringeRate }: UnitFigures) {
  return {
    salary: salary.value,
    isSalaryOverridden: salary.value !== salary.valueWithoutOverride,
    salaryHint: null,
    fringe:
      salary.value === null ? null : salary.value * (fringeRate.value ?? 0),
  };
}

const gradAppointmentOf = (lines: CostLine[]) =>
  lines.find(({ gradAppointment }) => gradAppointment !== undefined)
    ?.gradAppointment;

function gradPriceOf(lines: CostLine[]) {
  const appointment = gradAppointmentOf(lines);

  return {
    salary: appointment?.cost?.pay ?? null,
    isSalaryOverridden: false,
    salaryHint: appointment === undefined ? null : gradHintOf(appointment),
    fringe: appointment?.cost?.fringe ?? null,
  };
}

function receiptOf({
  lines,
  unitFigures,
  paidCount,
  total,
  isEditable,
  taWork,
}: {
  lines: CostLine[];
  unitFigures: UnitFigures;
  paidCount: number;
  total: number;
  isEditable: boolean;
  taWork?: TaWork;
}): ReceiptLine[] {
  const appointment = gradAppointmentOf(lines);
  if (appointment?.cost) {
    return gradReceiptOf(appointment.student, appointment.cost, isEditable);
  }

  return salaryReceiptOf({
    ...unitFigures,
    sectionCount: paidCount,
    total,
    isEditable,
    taWork,
  });
}

function gradHintOf({ student, cost }: GradAppointment): string | null {
  const credits = cost?.figures.creditsTaught ?? student.creditsTaught;
  if (credits > 0) {
    const standing = student.isAbd ? " ABD" : "";

    return `${student.appointmentPercent}%${standing} · ${credits} ${credits === 1 ? "credit" : "credits"}`;
  }

  const offsets = (cost?.feeOffset ?? 0) + (cost?.internationalOffset ?? 0);

  return offsets > 0 ? `incl. ${formatWholeDollars(offsets)} offset` : null;
}

function unstaffedRowsOf(charges: Charge[], rate: Rate | null): PersonRow[] {
  const paidCount = charges.filter(({ line }) => isPaid(line)).length;
  if (paidCount === 0) return [];

  const unitFigures = unitFiguresOf(rate, undefined);
  const price = unitPriceOf(unitFigures);
  const chargeSummary = chargeSummaryOf(charges);

  return [
    {
      emplid: null,
      name: "Unstaffed",
      jobCode: UNSTAFFED_JOB_CODE,
      title: "Unstaffed",
      jobLabel: jobLabelOf(UNSTAFFED_JOB_CODE, "Unstaffed"),
      instructorType: null,
      fundLabel: "UI",
      ...price,
      termSalary: sumOf(charges.map(({ line }) => line.salary)),
      termFringe: sumOf(charges.map(({ line }) => line.fringe)),
      loadLabel: String(paidCount),
      paidSectionCount: paidCount,
      courseReleases: null,
      releaseSource: null,
      yearStarted: null,
      ...chargeSummary,
      isAssigned: true,
      notes: "",
      leaves: [],
      isGrad: false,
      appointmentPercent: null,
      hasFeeOffset: false,
      isInternational: false,
      isAbd: false,
      receipt: receiptOf({
        lines: [],
        unitFigures,
        paidCount,
        total: chargeSummary.total,
        isEditable: false,
      }),
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
