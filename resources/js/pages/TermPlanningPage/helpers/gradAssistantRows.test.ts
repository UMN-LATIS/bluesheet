import { describe, expect, it } from "vitest";
import {
  gradAssistantRowsOf,
  gradAssistantTotalsOf,
} from "./gradAssistantRows";
import type { PersonRow } from "./peopleRows";

const FALL_2026 = 1269;

const personRow = (extra: Partial<PersonRow> = {}): PersonRow => ({
  emplid: 1,
  name: "Last, First",
  jobCode: "9511",
  title: "Teaching Assistant",
  instructorType: "teaching_assistant",
  fundLabel: "TA/GI",
  salary: 0,
  salaryWithoutOverride: null,
  isSalaryOverridden: false,
  isSalaryReadOnly: true,
  salaryHint: null,
  fringe: 0,
  termSalary: 0,
  termFringe: 0,
  loadLabel: "25%",
  paidSectionCount: 1,
  expectedSectionCount: null,
  expectedSectionCountWithoutOverride: null,
  courseReleases: null,
  releaseSource: null,
  yearStarted: 2026,
  isUnderLoad: false,
  total: 1000,
  hasMissingRate: false,
  sections: [],
  isAssigned: true,
  notes: "",
  leaves: [],
  isGrad: true,
  appointmentPercent: 25,
  hasFeeOffset: false,
  isInternational: false,
  isAbd: false,
  receipt: [],
  ...extra,
});

describe("gradAssistantRowsOf", () => {
  it("keeps TAs and grad instructors, in the order given", () => {
    const rows = gradAssistantRowsOf(
      [
        personRow({ emplid: 1, instructorType: "graduate_instructor" }),
        personRow({ emplid: 2, instructorType: "pa_instructor" }),
        personRow({ emplid: 3, instructorType: null }),
        personRow({ emplid: 4 }),
      ],
      FALL_2026,
    );

    expect(rows.map(({ emplid }) => emplid)).toEqual([1, 4]);
    expect(rows.map(({ appointmentLabel }) => appointmentLabel)).toEqual([
      "Grad instructor",
      "TA",
    ]);
  });

  it("owes support in funding years 1 to 5", () => {
    const [first, fifth, sixth] = gradAssistantRowsOf(
      [
        personRow({ yearStarted: 2026 }),
        personRow({ yearStarted: 2022 }),
        personRow({ yearStarted: 2021 }),
      ],
      FALL_2026,
    );

    expect(first).toMatchObject({ fundingYear: 1, isOwedSupport: true });
    expect(fifth).toMatchObject({ fundingYear: 5, isOwedSupport: true });
    expect(sixth).toMatchObject({
      fundingYear: 6,
      isOwedSupport: false,
      isOutsideFundingWindow: true,
      supportLabel: "Outside window",
    });
  });

  it("leaves the funding year unknown without a year started", () => {
    const [row] = gradAssistantRowsOf(
      [personRow({ yearStarted: null })],
      FALL_2026,
    );

    expect(row).toMatchObject({
      fundingYear: null,
      isOwedSupport: null,
      isOutsideFundingWindow: false,
      isUnfunded: false,
      supportLabel: "—",
    });
  });

  it("flags a student owed support who has no appointment", () => {
    const rows = gradAssistantRowsOf(
      [
        personRow({ appointmentPercent: 0 }),
        personRow({ appointmentPercent: 0, yearStarted: 2019 }),
        personRow({ appointmentPercent: 12.5 }),
      ],
      FALL_2026,
    );

    expect(rows.map(({ isUnfunded }) => isUnfunded)).toEqual([
      true,
      false,
      false,
    ]);
  });
});

describe("gradAssistantTotalsOf", () => {
  it("counts students, owed support, and funded appointments", () => {
    const rows = gradAssistantRowsOf(
      [
        personRow({ appointmentPercent: 25, total: 100 }),
        personRow({ appointmentPercent: 0, total: 0 }),
        personRow({ appointmentPercent: 50, yearStarted: 2018, total: 250 }),
      ],
      FALL_2026,
    );

    expect(gradAssistantTotalsOf(rows)).toEqual({
      studentCount: 3,
      owedSupportCount: 2,
      fundedCount: 2,
      totalCost: 350,
    });
  });
});
