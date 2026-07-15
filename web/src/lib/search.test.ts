import { describe, expect, it } from "vitest";
import { matchesSearchText, normalizeSearchText } from "./search";

describe("shared text search", () => {
  it.each([
    ["Muhammad Yusuf", "yusuf"],
    ["Muhammad Rizki", "rizki"],
    ["Muhammad Nasuha", "nasuha"],
    ["Jureid Sholahuddin", "jureid"],
    ["Jureid Sholahuddin", "sholahuddin"],
    ["Muhammad Yusuf", "muhammad"],
  ])("finds %s with a substring query %s", (value, query) => {
    expect(matchesSearchText(value, query)).toBe(true);
  });

  it("normalizes casing and repeated whitespace before matching", () => {
    expect(normalizeSearchText("  MUHAMMAD   YUSUF  ")).toBe("muhammad yusuf");
    expect(matchesSearchText("Muhammad Yusuf", "  yUsUf  ")).toBe(true);
  });
});
