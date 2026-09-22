import { describe, expect, it } from "vitest";
import { isHttpUrl } from "./isHttpUrl";

describe("isHttpUrl", () => {
  it.each(["https://umn.edu", "http://umn.edu/path?q=1"])("accepts %s", (url) =>
    expect(isHttpUrl(url)).toBe(true),
  );

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "mailto:someone@umn.edu",
    "umn.edu",
    "",
  ])("refuses %s", (url) => expect(isHttpUrl(url)).toBe(false));
});
