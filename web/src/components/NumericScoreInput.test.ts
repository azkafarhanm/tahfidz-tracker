import { describe, expect, it } from "vitest";
import { resolveNumericScoreValue } from "@/lib/numeric-score";

describe("resolveNumericScoreValue", () => {
  it("preserves empty values while editing", () => {
    expect(resolveNumericScoreValue("", "90")).toBe("");
  });

  it("accepts digits from 0 through 100", () => {
    expect(resolveNumericScoreValue("0", "")).toBe("0");
    expect(resolveNumericScoreValue("87", "")).toBe("87");
    expect(resolveNumericScoreValue("100", "")).toBe("100");
  });

  it("removes non-digit characters", () => {
    expect(resolveNumericScoreValue("9a0", "")).toBe("90");
  });

  it("keeps the current value when the candidate exceeds 100", () => {
    expect(resolveNumericScoreValue("101", "10")).toBe("10");
    expect(resolveNumericScoreValue("999", "99")).toBe("99");
  });
});
