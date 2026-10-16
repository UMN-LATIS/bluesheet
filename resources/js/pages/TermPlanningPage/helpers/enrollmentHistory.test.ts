import { describe, expect, it } from "vitest";
import type { EnrollmentHistory, EnrollmentHistorySection } from "@/types";
import {
  enrollmentSeriesBySection,
  enrollmentFillStepOf,
  historyKeyOf,
  latestFillOf,
  previousOfferingsOf,
  termNameOf,
} from "./enrollmentHistory";

const offering = (
  courseCode: string,
  section: string,
  termCode: number,
  enrollmentTotal: number,
): EnrollmentHistorySection => ({
  courseCode,
  section,
  termCode,
  enrollmentTotal,
  enrollmentCap: 30,
  leadInstructorLastName: null,
  meetings: [],
});

describe("enrollmentSeriesBySection", () => {
  it("has one point per history term, in the order of termCodes", () => {
    const history: EnrollmentHistory = {
      termCodes: [1249, 1253, 1259],
      sections: [offering("ANTH-1001", "001", 1259, 28)],
    };

    const series = enrollmentSeriesBySection(history).get(
      historyKeyOf("ANTH-1001", "001"),
    );

    expect(series?.map(({ termCode }) => termCode)).toEqual([1249, 1253, 1259]);
  });

  it("has a null offering for terms the section did not run", () => {
    const history: EnrollmentHistory = {
      termCodes: [1249, 1253, 1259],
      sections: [
        offering("ANTH-1001", "001", 1249, 20),
        offering("ANTH-1001", "001", 1259, 28),
      ],
    };

    const series = enrollmentSeriesBySection(history).get("ANTH-1001|001");

    expect(
      series?.map(({ offering }) => offering?.enrollmentTotal ?? null),
    ).toEqual([20, null, 28]);
  });

  it("keys each series by course code and section number", () => {
    const history: EnrollmentHistory = {
      termCodes: [1249],
      sections: [
        offering("ANTH-1001", "001", 1249, 20),
        offering("HIST-1001", "001", 1249, 15),
      ],
    };

    expect([...enrollmentSeriesBySection(history).keys()]).toEqual([
      "ANTH-1001|001",
      "HIST-1001|001",
    ]);
  });

  it("keeps two sections of one course separate", () => {
    const history: EnrollmentHistory = {
      termCodes: [1249],
      sections: [
        offering("ANTH-1001", "001", 1249, 20),
        offering("ANTH-1001", "002", 1249, 25),
      ],
    };

    const series = enrollmentSeriesBySection(history);

    expect(series.get("ANTH-1001|001")?.[0].offering?.enrollmentTotal).toBe(20);
    expect(series.get("ANTH-1001|002")?.[0].offering?.enrollmentTotal).toBe(25);
  });

  it("has no entries when no section ran in any history term", () => {
    expect(
      enrollmentSeriesBySection({ termCodes: [1249], sections: [] }).size,
    ).toBe(0);
  });
});

describe("termNameOf", () => {
  it("names fall and spring terms", () => {
    expect(termNameOf(1259)).toBe("Fall 2025");
    expect(termNameOf(1263)).toBe("Spring 2026");
  });
});

describe("previousOfferingsOf", () => {
  const history: EnrollmentHistory = {
    termCodes: [1249, 1253, 1255, 1259],
    sections: [
      {
        ...offering("ANTH-3201", "001", 1249, 36),
        leadInstructorLastName: "Okafor",
        meetings: [{ days: ["wed"], startTime: "16:00", endTime: "16:50" }],
      },
      offering("ANTH-3201", "001", 1253, 30),
      offering("ANTH-3201", "001", 1259, 40),
      offering("ANTH-3201", "002", 1259, 12),
      offering("ANTH-1001", "001", 1259, 300),
    ],
  };

  it("lists every history term, newest first, as the tiles do", () => {
    const offerings = previousOfferingsOf(history, "ANTH-3201", "001");

    expect(offerings.map(({ termName }) => termName)).toEqual([
      "Fall 2025",
      "Summer 2025",
      "Spring 2025",
      "Fall 2024",
    ]);
  });

  it("shows a term the section did not run as not offered", () => {
    const [, summer2025] = previousOfferingsOf(history, "ANTH-3201", "001");

    expect(summer2025).toMatchObject({
      isOffered: false,
      enrolledOfCap: "—",
      enrollment: null,
    });
  });

  it("shows the instructor, meeting time, and enrolled of cap", () => {
    const fall2024 = previousOfferingsOf(history, "ANTH-3201", "001").at(-1);

    expect(fall2024).toMatchObject({
      isOffered: true,
      instructorLastName: "Okafor",
      meetingSummary: "W 4 – 4:50p",
      enrolledOfCap: "36/30",
      enrollment: { enrollmentTotal: 36, enrollmentCap: 30 },
    });
  });

  it("is empty for a section never offered before", () => {
    expect(previousOfferingsOf(history, "ANTH-3201", "003")).toEqual([]);
  });
});

describe("enrollmentFillStepOf", () => {
  const stepAt = (enrollmentTotal: number) =>
    enrollmentFillStepOf({ enrollmentTotal, enrollmentCap: 100 });

  it("is 0 up to 40% full", () => {
    expect(stepAt(0)).toBe(0);
    expect(stepAt(40)).toBe(0);
  });

  it("is 5 from 95% full, and above", () => {
    expect(stepAt(95)).toBe(5);
    expect(stepAt(120)).toBe(5);
  });

  it("rises evenly between", () => {
    expect([51, 62, 73, 84].map(stepAt)).toEqual([1, 2, 3, 4]);
  });

  it("treats a section with no cap as full", () => {
    expect(enrollmentFillStepOf({ enrollmentTotal: 3, enrollmentCap: 0 })).toBe(
      5,
    );
  });
});

describe("latestFillOf", () => {
  it("is the fill of the latest term the section ran", () => {
    expect(
      latestFillOf([
        { termCode: 1249, offering: offering("ANTH-1001", "001", 1249, 30) },
        { termCode: 1253, offering: offering("ANTH-1001", "001", 1253, 15) },
        { termCode: 1259, offering: null },
      ]),
    ).toBe(0.5);
  });

  it("is null when the section never ran", () => {
    expect(latestFillOf([{ termCode: 1259, offering: null }])).toBeNull();
  });
});
