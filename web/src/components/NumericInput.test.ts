import { describe, expect, it } from "vitest";
import { sanitizeNumericInputValue } from "@/lib/numeric-input";

describe("sanitizeNumericInputValue", () => {
  it("preserves digits and empty values", () => {
    expect(sanitizeNumericInputValue("")).toBe("");
    expect(sanitizeNumericInputValue("123")).toBe("123");
  });

  it("removes letters, spaces, and separator characters", () => {
    expect(sanitizeNumericInputValue("1a 2-3.4")).toBe("1234");
  });
});
