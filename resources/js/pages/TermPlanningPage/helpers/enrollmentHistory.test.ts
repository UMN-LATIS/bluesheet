import { describe, expect, it } from "vitest";
import type { EnrollmentHistory, EnrollmentHistorySection } from "@/types";
import { enrollmentSeriesBySection, historyKeyOf } from "./enrollmentHistory";

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

    expect(series?.map(({ offering }) => offering?.enrollmentTotal ?? null)).toEqual(
      [20, null, 28],
    );
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
