import { describe, expect, it } from "vitest";
import { refusalOfSettingValue } from "./costSettingValues";

describe("refusalOfSettingValue", () => {
  it("accepts what the server accepts", () => {
    expect(refusalOfSettingValue("money", 12000.5)).toBeNull();
    expect(refusalOfSettingValue("percent", 12.5)).toBeNull();
    expect(refusalOfSettingValue("count", 4)).toBeNull();
  });

  it("refuses negative money and fractions of a cent", () => {
    expect(refusalOfSettingValue("money", -1)).not.toBeNull();
    expect(refusalOfSettingValue("money", 1.005)).not.toBeNull();
  });

  it("refuses a percent of zero or over 100", () => {
    expect(refusalOfSettingValue("percent", 0)).not.toBeNull();
    expect(refusalOfSettingValue("percent", 100.01)).not.toBeNull();
  });

  it("refuses a fractional or oversized annual load", () => {
    expect(refusalOfSettingValue("count", 2.5)).not.toBeNull();
    expect(refusalOfSettingValue("count", 41)).not.toBeNull();
  });
});
