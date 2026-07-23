import { describe, expect, it } from "vitest";

import {
  parseMeetingMonthState,
  parseRecordMaterialPreference,
} from "@/lib/ui-session-state";

describe("parseMeetingMonthState", () => {
  it("defaults every month to collapsed when session state is absent", () => {
    expect(parseMeetingMonthState(null)).toEqual({});
  });

  it("keeps only valid persisted month flags", () => {
    expect(
      parseMeetingMonthState(
        JSON.stringify({ "2026-07": true, "2026-06": false, invalid: "open" }),
      ),
    ).toEqual({ "2026-07": true, "2026-06": false });
  });

  it("fails safely for malformed session data", () => {
    expect(parseMeetingMonthState("{")).toEqual({});
  });
});

describe("parseRecordMaterialPreference", () => {
  const validSurahs = new Set(["Al-Mursalat", "Al-Mulk"]);

  it("accepts a valid Surah and Juz preference", () => {
    expect(
      parseRecordMaterialPreference(
        JSON.stringify({ juz: 29, surah: "Al-Mursalat" }),
        validSurahs,
      ),
    ).toEqual({ juz: 29, surah: "Al-Mursalat" });
  });

  it.each([
    JSON.stringify({ juz: 0, surah: "Al-Mursalat" }),
    JSON.stringify({ juz: 29, surah: "Unknown" }),
    JSON.stringify({ juz: 29 }),
    "{",
  ])("rejects invalid preference %s", (raw) => {
    expect(parseRecordMaterialPreference(raw, validSurahs)).toBeNull();
  });
});
