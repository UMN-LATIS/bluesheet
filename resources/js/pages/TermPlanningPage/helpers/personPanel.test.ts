import { describe, expect, it } from "vitest";
import type { TeachingHistory, TeachingSection } from "@/types";
import { sisInstructor } from "./costAssumptions.fixture";
import { personTermSectionsOf, taughtTermsOf } from "./personPanel";
import { plannedSection } from "./plannedSection.fixture";
import type { SectionCost } from "./termEstimate";

const monday9 = [
  { days: ["mon" as const], startTime: "09:00", endTime: "09:50" },
];

describe("personTermSectionsOf", () => {
  const sections = [
    plannedSection(1, monday9, { instructors: [sisInstructor(7, "PI")] }),
    plannedSection(2, monday9, {
      section: "002",
      instructors: [sisInstructor(7, "TA")],
    }),
    plannedSection(3, monday9, {
      section: "003",
      isCancelled: true,
      instructors: [sisInstructor(7, "PI")],
    }),
    plannedSection(4, monday9, { section: "004" }),
  ];

  it("lists the person's live sections, marking the ones they TA", () => {
    expect(
      personTermSectionsOf(7, sections, null).map(({ label, isTa }) => [
        label,
        isTa,
      ]),
    ).toEqual([
      ["1001-001", false],
      ["1001-002", true],
    ]);
  });

  it("has no amount outside the Budget view", () => {
    expect(personTermSectionsOf(7, sections, null)[0].amount).toBeUndefined();
  });

  it("shows the person's cost on each section", () => {
    const costs = new Map<number, SectionCost>([
      [
        1,
        {
          instructorCost: 4000,
          taCost: 0,
          total: 4000,
          lines: [
            {
              role: "instructor",
              emplid: 7,
              amount: 4000,
              basis: { kind: "rate" },
            },
          ],
        },
      ],
    ]);

    expect(personTermSectionsOf(7, sections, costs)[0].amount).toBe(4000);
  });
});

describe("taughtTermsOf", () => {
  const taught = (
    termCode: number,
    section: string,
    emplid: number,
    extra: Partial<TeachingSection> = {},
  ): TeachingSection => ({
    key: `ANTH-1001-${section}-${termCode}`,
    termCode,
    courseCode: "ANTH-1001",
    subject: "ANTH",
    catalogNumber: "1001",
    section,
    title: "Human Evolution",
    component: "LEC",
    enrollmentTotal: 30,
    enrollmentCap: 40,
    isPlanned: false,
    instructors: [{ emplid, role: "PI" }],
    ...extra,
  });

  const history: TeachingHistory = {
    people: [],
    readOnlyTermCodes: [],
    sections: [
      taught(1249, "001", 7),
      taught(1259, "001", 7),
      taught(1259, "002", 7, { instructors: [{ emplid: 7, role: "TA" }] }),
      taught(1255, "001", 7),
      taught(1259, "003", 8),
    ],
  };

  it("groups the person's fall and spring sections by term, newest first", () => {
    const terms = taughtTermsOf(history, 7);

    expect(terms.map(({ termName }) => termName)).toEqual([
      "Fall 2025",
      "Fall 2024",
    ]);
    expect(terms[0].sections).toMatchObject([
      { label: "ANTH 1001-001", isTa: false, enrolledOfCap: "30/40" },
      { label: "ANTH 1001-002", isTa: true },
    ]);
  });
});
