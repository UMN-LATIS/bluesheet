import { describe, expect, it } from "vitest";
import { axisFor, dayNumberOf, fractionOf, spanOf } from "./timelineAxis";
import { FALL_2026, SPRING_2027, TERMS } from "./planning.fixture";

const fallThroughSpring = axisFor(TERMS, {
  startTermId: FALL_2026.id,
  endTermId: SPRING_2027.id,
})!;

describe("axisFor", () => {
  it("runs from the first term's first day through the last term's last day", () => {
    expect(fallThroughSpring.startDate).toBe("2026-09-08");
    expect(fallThroughSpring.endDate).toBe("2027-05-12");
    expect(fallThroughSpring.dayCount).toBe(
      dayNumberOf("2027-05-12") - dayNumberOf("2026-09-08") + 1,
    );
  });

  it("places terms in order and the winter break between them", () => {
    const [fall, spring] = fallThroughSpring.terms;

    expect(fall.term.id).toBe(1269);
    expect(fall.left).toBe(0);
    expect(spring.left + spring.width).toBeCloseTo(1);
    expect(fallThroughSpring.gaps).toHaveLength(1);
    expect(fallThroughSpring.gaps[0].left).toBeCloseTo(fall.left + fall.width);
    expect(fallThroughSpring.gaps[0].left + fallThroughSpring.gaps[0].width).toBeCloseTo(
      spring.left,
    );
  });

  it("labels months, naming the year in January", () => {
    expect(fallThroughSpring.months.map(({ label }) => label)).toEqual([
      "Oct",
      "Nov",
      "Dec",
      "Jan 2027",
      "Feb",
      "Mar",
      "Apr",
      "May",
    ]);
  });

  it("is null when the range names a term it has no dates for", () => {
    expect(axisFor(TERMS, { startTermId: 1269, endTermId: 1279 })).toBeNull();
  });
});

describe("spanOf", () => {
  it("covers a whole term, both ends inclusive", () => {
    const span = spanOf(fallThroughSpring, "2026-09-08", "2026-12-23");

    expect(span.left).toBe(0);
    expect(span.width).toBeCloseTo(fallThroughSpring.terms[0].width);
    expect(span.isClippedAtStart).toBe(false);
  });

  it("clamps a leave that runs past either end and says which", () => {
    const span = spanOf(fallThroughSpring, "2026-02-01", "2027-08-01");

    expect(span.left).toBe(0);
    expect(span.width).toBe(1);
    expect(span.isClippedAtStart).toBe(true);
    expect(span.isClippedAtEnd).toBe(true);
  });

  it("places a date inside the range proportionally", () => {
    const midpoint = fractionOf(fallThroughSpring, "2027-01-01");

    expect(midpoint).toBeGreaterThan(fallThroughSpring.terms[0].width);
    expect(midpoint).toBeLessThan(fallThroughSpring.terms[1].left);
  });
});
