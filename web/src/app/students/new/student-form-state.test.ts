import { describe, expect, it } from "vitest";
import {
  resolveInitialHalaqahLevel,
  resolveLevelForGrade,
} from "./student-form-state";

const classGroups = [
  { grade: 8, levelKey: "MEDIUM", programType: "ACADEMIC" },
  { grade: 9, levelKey: "HIGH", programType: "ACADEMIC" },
  { grade: 9, levelKey: "LOW", programType: "BOARDING" },
];

describe("student form halaqah initialization", () => {
  it("resolves the locked Academic level from a prefilled grade", () => {
    expect(resolveInitialHalaqahLevel(classGroups, "8", "", "ACADEMIC"))
      .toBe("MEDIUM");
    expect(resolveInitialHalaqahLevel(classGroups, "9", "", "ACADEMIC"))
      .toBe("HIGH");
  });

  it("preserves the default state when no grade is prefilled", () => {
    expect(resolveInitialHalaqahLevel(classGroups, "", "", "ACADEMIC"))
      .toBe("");
  });

  it("does not derive a level for Boarding", () => {
    expect(resolveInitialHalaqahLevel(classGroups, "9", "", "BOARDING"))
      .toBe("");
  });

  it("uses the same grade resolver after an interactive change", () => {
    expect(resolveLevelForGrade(classGroups, "9", "ACADEMIC")).toBe("HIGH");
  });
});
