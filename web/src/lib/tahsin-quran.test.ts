import { describe, expect, it } from "vitest";
import { RecordStatus } from "@/generated/prisma-next/enums";
import {
  normalizeTahsinAyahRange,
  resolveTahsinQuranDefault,
  tahsinMeetingWeekStart,
  validateTahsinAyahRange,
} from "./tahsin-quran";

const surahs = [
  { id: "fatihah", number: 1, name: "Al-Fatihah", totalAyahs: 7 },
  { id: "baqarah", number: 2, name: "Al-Baqarah", totalAyahs: 286 },
  { id: "imran", number: 3, name: "Ali 'Imran", totalAyahs: 200 },
  { id: "nas", number: 114, name: "An-Nas", totalAyahs: 6 },
];

const day = (iso: string) => new Date(iso).toISOString().slice(0, 10);

describe("Tahsin meeting week", () => {
  it("puts every day of one week on the same Monday", () => {
    // Monday 5 Oct 2026 through Sunday 11 Oct 2026, Jakarta time.
    for (const iso of [
      "2026-10-05T01:00:00.000Z",
      "2026-10-06T08:00:00.000Z",
      "2026-10-08T03:00:00.000Z",
      "2026-10-11T10:00:00.000Z",
    ]) {
      expect(day(tahsinMeetingWeekStart(new Date(iso)).toISOString())).toBe("2026-10-05");
    }
  });

  it("uses the Jakarta calendar, not UTC, at the week boundary", () => {
    // 20:00 UTC on Sunday 11 Oct is already 03:00 Monday 12 Oct in Jakarta.
    expect(day(tahsinMeetingWeekStart(new Date("2026-10-11T20:00:00.000Z")).toISOString())).toBe("2026-10-12");
  });
});

describe("Tahsin ayah range", () => {
  it("accepts a range inside the surah and a single ayah", () => {
    expect(validateTahsinAyahRange(1, 15, 286).ok).toBe(true);
    expect(validateTahsinAyahRange(17, null, 286).ok).toBe(true);
  });

  it.each([
    [0, null, "positif"],
    [10, 9, "lebih kecil"],
    [287, null, "286 ayat"],
    [280, 290, "286 ayat"],
  ])("rejects start %i end %s", (start, end, message) => {
    const result = validateTahsinAyahRange(start, end, 286);
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain(message);
  });

  it("stores a single-ayah reading without an end ayah", () => {
    expect(normalizeTahsinAyahRange(17, 17)).toEqual({ startAyah: 17, endAyah: null });
    expect(normalizeTahsinAyahRange(17, 18)).toEqual({ startAyah: 17, endAyah: 18 });
  });
});

describe("Tahsin Qur'an default", () => {
  const last = (startAyah: number, endAyah: number | null, status: RecordStatus = RecordStatus.CUKUP, surahId = "baqarah") =>
    ({ surahId, startAyah, endAyah, status });

  it("starts a new student at Al-Baqarah ayah 1 with the end left open", () => {
    expect(resolveTahsinQuranDefault(null, surahs)).toEqual({ surahId: "baqarah", startAyah: 1, endAyah: null });
  });

  it("continues after the last ayah with the same number of ayat", () => {
    expect(resolveTahsinQuranDefault(last(15, 16), surahs)).toEqual({ surahId: "baqarah", startAyah: 17, endAyah: 18 });
    expect(resolveTahsinQuranDefault(last(1, 15), surahs)).toEqual({ surahId: "baqarah", startAyah: 16, endAyah: 30 });
  });

  it("continues a single-ayah reading one ayah at a time", () => {
    expect(resolveTahsinQuranDefault(last(20, null), surahs)).toEqual({ surahId: "baqarah", startAyah: 21, endAyah: null });
  });

  it("repeats the same range when the last reading needs murojaah", () => {
    expect(resolveTahsinQuranDefault(last(15, 16, RecordStatus.PERLU_MUROJAAH), surahs))
      .toEqual({ surahId: "baqarah", startAyah: 15, endAyah: 16 });
  });

  it("never runs past the end of the surah", () => {
    expect(resolveTahsinQuranDefault(last(275, 284), surahs)).toEqual({ surahId: "baqarah", startAyah: 285, endAyah: 286 });
  });

  it("rolls a finished surah over to ayah 1 of the next", () => {
    expect(resolveTahsinQuranDefault(last(281, 286), surahs)).toEqual({ surahId: "imran", startAyah: 1, endAyah: 6 });
  });

  it("stays on the last ayah once An-Nas is finished", () => {
    expect(resolveTahsinQuranDefault(last(1, 6, RecordStatus.LANCAR, "nas"), surahs))
      .toEqual({ surahId: "nas", startAyah: 6, endAyah: null });
  });
});
