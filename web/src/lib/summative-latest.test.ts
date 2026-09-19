import { describe, expect, it } from "vitest";
import { isMoreRecentSummativeScore } from "@/lib/summative-latest";

const at = (iso: string, surahNumber: number) => ({
  surahNumber,
  updatedAt: new Date(iso),
});

describe("summative latest score", () => {
  it("prefers the score saved most recently", () => {
    expect(
      isMoreRecentSummativeScore(
        at("2026-09-17T10:00:00.000Z", 76),
        at("2026-08-27T10:00:00.000Z", 92),
      ),
    ).toBe(true);
  });

  it("does not let a later surah override an earlier save", () => {
    expect(
      isMoreRecentSummativeScore(
        at("2026-08-27T10:00:00.000Z", 92),
        at("2026-09-17T10:00:00.000Z", 76),
      ),
    ).toBe(false);
  });

  it("breaks exact ties deterministically", () => {
    const instant = "2026-09-17T10:00:00.000Z";
    expect(isMoreRecentSummativeScore(at(instant, 92), at(instant, 76))).toBe(true);
    expect(isMoreRecentSummativeScore(at(instant, 76), at(instant, 92))).toBe(false);
  });
});
