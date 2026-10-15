import { describe, expect, it } from "vitest";
import { fundLabelOf } from "./fundLabel";

describe("fundLabelOf", () => {
  it("labels each instructor type by its fund", () => {
    expect(fundLabelOf("recurring_budget_faculty")).toBe("Recurring");
    expect(fundLabelOf("pa_instructor")).toBe("UI");
    expect(fundLabelOf("teaching_assistant")).toBe("TA/GI");
  });

  it("shows a dash when the job code has no instructor type", () => {
    expect(fundLabelOf(null)).toBe("—");
  });
});
