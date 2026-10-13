import { describe, expect, it } from "vitest";
import type { EnrollmentHistory, EnrollmentHistorySection } from "@/types";
import {
  enrollmentSeriesBySection,
  historyKeyOf,
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
  waitlistTotal: 0,
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

  it("lists the section's offerings in the same season, newest first", () => {
    const offerings = previousOfferingsOf(history, "ANTH-3201", "001", 1269);

    expect(offerings.map(({ termName }) => termName)).toEqual([
      "Fall 2025",
      "Fall 2024",
    ]);
  });

  it("shows the instructor, meeting time, and enrolled of cap", () => {
    const [, fall2024] = previousOfferingsOf(history, "ANTH-3201", "001", 1269);

    expect(fall2024).toMatchObject({
      instructorLastName: "Okafor",
      meetingSummary: "W 4 – 4:50p",
      enrolledOfCap: "36/30",
    });
  });

  it("is empty for a section never offered before", () => {
    expect(previousOfferingsOf(history, "ANTH-3201", "003", 1269)).toEqual([]);
  });
});
