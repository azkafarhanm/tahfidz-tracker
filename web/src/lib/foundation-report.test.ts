import { describe, expect, it } from "vitest";
import {
  buildFoundationStudentReport,
  formatPeriodLabel,
  formatSurahDetail,
  isDayKey,
  periodBounds,
  resolveDefaultPeriod,
  type ReportRecitation,
} from "./foundation-report";
import { surahList } from "./surahs";

const at = (iso: string) => new Date(iso);
const row = (surah: string, fromAyah: number, toAyah: number, date = "2026-08-10T08:00:00+07:00"): ReportRecitation =>
  ({ surah, fromAyah, toAyah, date: at(date) });
const firstPeriod = periodBounds("2026-07-13", "2026-09-28");

describe("foundation report period", () => {
  it("covers whole Jakarta days on both ends", () => {
    const report = buildFoundationStudentReport([
      row("Al-Mulk", 1, 5, "2026-07-13T00:05:00+07:00"),
      row("Al-Mulk", 6, 10, "2026-09-28T23:55:00+07:00"),
      row("Al-Mulk", 11, 15, "2026-09-29T00:05:00+07:00"),
    ], [], firstPeriod);
    expect(report.hafalanSetoran).toBe(2);
    expect(report.hafalanBaru).toBe("10 Ayat");
  });

  it("starts the next report the day after the last one ended", () => {
    expect(resolveDefaultPeriod({ lastPeriodEnd: "2026-09-28", firstActivityDay: "2026-07-13", today: "2026-11-20" }))
      .toEqual({ from: "2026-09-29", to: "2026-11-20" });
  });

  it("starts the first report at the first recorded setoran", () => {
    expect(resolveDefaultPeriod({ lastPeriodEnd: null, firstActivityDay: "2026-07-13", today: "2026-09-28" }))
      .toEqual({ from: "2026-07-13", to: "2026-09-28" });
  });

  it("never proposes a start after today", () => {
    expect(resolveDefaultPeriod({ lastPeriodEnd: "2026-09-28", firstActivityDay: null, today: "2026-09-28" }))
      .toEqual({ from: "2026-09-28", to: "2026-09-28" });
  });

  it("validates calendar days", () => {
    expect(isDayKey("2026-09-28")).toBe(true);
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("28-09-2026")).toBe(false);
  });

  it("writes the period in Indonesian", () => {
    expect(formatPeriodLabel("2026-07-13", "2026-09-28")).toBe("13 Juli 2026 – 28 September 2026");
  });
});

describe("foundation report hafalan", () => {
  it("names the complete surahs in mushaf order and the partial one with its ayat", () => {
    const report = buildFoundationStudentReport([
      row("At-Tur", 1, 49),
      row("Adz-Dzariyat", 1, 60),
      row("Al-Ahqaf", 1, 35),
      row("Muhammad", 1, 38),
      row("Al-Fath", 1, 28),
    ], [], firstPeriod);
    expect(report.hafalanBaru).toBe("4 Surah + 28 Ayat");
    expect(report.rincianHafalan).toEqual({
      penuh: ["Al-Ahqaf", "Muhammad", "Adz-Dzariyat", "At-Tur"],
      sebagian: ["Al-Fath 1–28"],
    });
    expect(formatSurahDetail(report.rincianHafalan)).toBe("Penuh: Al-Ahqaf, Muhammad, Adz-Dzariyat, At-Tur\nSebagian: Al-Fath 1–28");
  });

  it("counts only ayat never memorised before the period, and marks a surah finished across periods", () => {
    const nextPeriod = periodBounds("2026-09-29", "2026-11-20");
    const report = buildFoundationStudentReport([
      row("Al-Fath", 1, 28, "2026-09-01T08:00:00+07:00"),
      row("Al-Fath", 1, 29, "2026-10-05T08:00:00+07:00"), // re-setor 1–28 plus the new ayah 29
    ], [], nextPeriod);
    expect(report.hafalanSetoran).toBe(1);
    expect(report.hafalanBaru).toBe("1 Ayat");
    expect(report.rincianHafalan).toEqual({ penuh: [], sebagian: ["Al-Fath 29 (surah tuntas)"] });
    expect(report.totalHafalan).toBe("4 Juz + 1 Surah");
  });

  it("spells out a finished juz as its surahs while the summary still says 1 Juz", () => {
    const juz30 = surahList.filter((surah) => surah.number >= 78);
    const report = buildFoundationStudentReport(juz30.map((surah) => row(surah.name, 1, surah.ayahs)), [], firstPeriod);
    expect(report.hafalanBaru).toBe("1 Juz");
    expect(report.rincianHafalan).toEqual({ penuh: juz30.map((surah) => surah.name), sebagian: [] });
    expect(report.rincianHafalan.penuh[0]).toBe("An-Naba");
    expect(report.rincianHafalan.penuh.at(-1)).toBe("An-Nas");
  });

  it("keeps the total cumulative while the period shows only what is new", () => {
    const nextPeriod = periodBounds("2026-09-29", "2026-11-20");
    const report = buildFoundationStudentReport([
      row("Al-Mulk", 1, 30, "2026-09-01T08:00:00+07:00"),
      row("Al-Qalam", 1, 52, "2026-10-01T08:00:00+07:00"),
    ], [], nextPeriod);
    expect(report.hafalanBaru).toBe("1 Surah");
    expect(report.rincianHafalan.penuh).toEqual(["Al-Qalam"]);
    expect(report.totalHafalan).toBe("1 Juz + 2 Surah");
  });

  it("lists every surah behind the total, including the juz already passed", () => {
    const report = buildFoundationStudentReport([
      row("Al-Mulk", 1, 30, "2026-09-01T08:00:00+07:00"),
      row("Al-Qalam", 1, 20, "2026-09-10T08:00:00+07:00"),
    ], [], firstPeriod);
    const juz30 = surahList.filter((surah) => surah.number >= 78).map((surah) => surah.name);
    expect(report.rincianTotal).toEqual({
      penuh: ["Al-Mulk", ...juz30],
      sebagian: ["Al-Qalam 1–20"],
    });
  });

  it("shows a dash and zero when nothing was memorised", () => {
    const report = buildFoundationStudentReport([], [], firstPeriod);
    expect(report.hafalanBaru).toBe("0 Ayat");
    expect(formatSurahDetail(report.rincianHafalan)).toBe("-");
  });
});

describe("foundation report murojaah", () => {
  it("counts full passes per surah and leaves the remainder as ranges", () => {
    const report = buildFoundationStudentReport([], [
      row("Al-Qamar", 1, 55),
      row("Al-Qamar", 1, 30),
      row("Al-Qamar", 31, 55),
      row("Al-Qamar", 1, 55),
      row("Al-Hashr", 4, 12),
      row("Al-Hashr", 4, 9),
    ], firstPeriod);
    expect(report.murojaahSetoran).toBe(6);
    expect(report.murojaahProgress).toBe("3 Surah + 15 Ayat");
    expect(report.rincianMurojaah).toEqual({
      penuh: ["Al-Qamar (3×)"],
      sebagian: ["Al-Hashr 4–9 (2×), 10–12"],
    });
  });

  it("ignores murojaah outside the period", () => {
    const nextPeriod = periodBounds("2026-09-29", "2026-11-20");
    const report = buildFoundationStudentReport([], [row("Al-Mulk", 1, 30, "2026-09-01T08:00:00+07:00")], nextPeriod);
    expect(report.murojaahSetoran).toBe(0);
    expect(report.murojaahProgress).toBe("0 Ayat");
  });
});

describe("foundation report: hafalan the teacher forgot to record", () => {
  it("fills the end of a surah once the student is recorded in the next one (Qaf 1–42, then Adz-Dzariyat)", () => {
    const report = buildFoundationStudentReport([
      row("Qaf", 1, 42, "2026-07-28T08:00:00+07:00"),
      row("Adz-Dzariyat", 1, 18, "2026-07-31T08:00:00+07:00"),
    ], [], firstPeriod);
    expect(report.hafalanBaru).toBe("1 Surah + 18 Ayat");
    expect(report.rincianHafalan).toEqual({ penuh: ["Qaf"], sebagian: ["Adz-Dzariyat 1–18"] });
  });

  it("dates a recovered ayah by the record that proved it, so it lands in that later period", () => {
    const firstReport = buildFoundationStudentReport([
      row("Qaf", 1, 42, "2026-09-20T08:00:00+07:00"),
      row("Adz-Dzariyat", 1, 18, "2026-10-02T08:00:00+07:00"),
    ], [], periodBounds("2026-07-13", "2026-09-28"));
    expect(firstReport.hafalanBaru).toBe("42 Ayat");

    const nextReport = buildFoundationStudentReport([
      row("Qaf", 1, 42, "2026-09-20T08:00:00+07:00"),
      row("Adz-Dzariyat", 1, 18, "2026-10-02T08:00:00+07:00"),
    ], [], periodBounds("2026-09-29", "2026-11-20"));
    expect(nextReport.hafalanBaru).toBe("21 Ayat");
    expect(nextReport.rincianHafalan.sebagian).toEqual(["Qaf 43–45 (surah tuntas)", "Adz-Dzariyat 1–18"]);
  });

  it("fills a gap inside a surah and at the start of the surah being worked on", () => {
    const report = buildFoundationStudentReport([
      row("Al-Hashr", 1, 7, "2026-09-09T08:00:00+07:00"),
      row("Al-Hashr", 10, 24, "2026-09-15T08:00:00+07:00"),
      row("At-Taghabun", 6, 9, "2026-09-27T08:00:00+07:00"),
    ], [], firstPeriod);
    expect(report.rincianHafalan.penuh).toContain("Al-Hashr");
    expect(report.rincianHafalan.sebagian).toContain("At-Taghabun 1–9");
    expect(JSON.stringify(report)).not.toContain("*");
  });

  it("does not fill surahs between an old out-of-order record and the student's current place", () => {
    // Adz-Dzariyat 1–60 was recited in July; juz 26 then started at Al-Ahqaf in
    // August and has only reached Al-Fath. Al-Hujurat and Qaf are still ahead.
    const report = buildFoundationStudentReport([
      row("Adz-Dzariyat", 1, 60, "2026-07-28T08:00:00+07:00"),
      row("Al-Ahqaf", 1, 35, "2026-08-30T08:00:00+07:00"),
      row("Muhammad", 1, 38, "2026-09-10T08:00:00+07:00"),
      row("Al-Fath", 1, 28, "2026-09-27T08:00:00+07:00"),
    ], [], firstPeriod);
    expect(report.rincianHafalan.penuh).not.toContain("Al-Hujurat");
    expect(report.rincianHafalan.penuh).not.toContain("Qaf");
    expect(report.rincianHafalan.sebagian).toEqual(["Al-Fath 1–28"]);
  });

  it("never assumes the start of the current juz before its first record", () => {
    // Juz 29 recorded from Al-Mursalat: Al-Mulk to Al-Qiyamah stay unrecorded.
    const report = buildFoundationStudentReport([
      row("Al-Mursalat", 1, 50, "2026-09-22T08:00:00+07:00"),
      row("Al-Insan", 1, 31, "2026-09-23T08:00:00+07:00"),
    ], [], firstPeriod);
    expect(report.hafalanBaru).toBe("2 Surah");
    expect(report.rincianHafalan.penuh).toEqual(["Al-Insan", "Al-Mursalat"]);
  });

  it("counts what the student reviewed toward the total, but not as new hafalan", () => {
    // Rizieq: hafalan recorded only up to Adz-Dzariyat 18 in juz 26, but his
    // murojaah covers Al-Ahqaf, Muhammad and Adz-Dzariyat 1–30 — so juz 26 is done.
    const report = buildFoundationStudentReport([
      row("Al-Fath", 1, 29, "2026-07-19T08:00:00+07:00"),
      row("Al-Hujurat", 1, 18, "2026-07-23T08:00:00+07:00"),
      row("Qaf", 1, 42, "2026-07-28T08:00:00+07:00"),
      row("Adz-Dzariyat", 1, 18, "2026-07-31T08:00:00+07:00"),
    ], [
      row("Al-Ahqaf", 1, 35, "2026-07-10T08:00:00+07:00"), // before the period: still proof
      row("Muhammad", 1, 38, "2026-08-05T08:00:00+07:00"),
      row("Adz-Dzariyat", 1, 30, "2026-09-01T08:00:00+07:00"),
    ], firstPeriod);
    expect(report.totalHafalan).toBe("5 Juz");
    expect(report.hafalanBaru).toBe("3 Surah + 18 Ayat");
    expect(report.murojaahSetoran).toBe(2);
  });

  it("ignores murojaah after the end of the period when building the total", () => {
    const report = buildFoundationStudentReport(
      [row("Al-Fath", 1, 29, "2026-07-19T08:00:00+07:00")],
      [row("Al-Ahqaf", 1, 35, "2026-10-05T08:00:00+07:00")],
      firstPeriod,
    );
    expect(report.rincianTotal.penuh).not.toContain("Al-Ahqaf");
  });
});

describe("foundation report: murojaah detail names each surah once", () => {
  it("counts a surah's real full passes even when the summary folds it into a juz", () => {
    const juz29 = surahList.filter((surah) => surah.number >= 67 && surah.number <= 77);
    const report = buildFoundationStudentReport([], [
      ...juz29.map((surah) => row(surah.name, 1, surah.ayahs)),
      ...juz29.map((surah) => row(surah.name, 1, surah.ayahs)),
      row("Al-Haqqah", 1, 52),
      row("Al-Haqqah", 1, 52),
      row("Al-Haqqah", 1, 30),
    ], firstPeriod);
    // Ten surahs twice each, Al-Haqqah four times: 24 passes, plus Al-Haqqah
    // 1–30 once more — the same figures a reader gets by adding up the detail.
    expect(report.murojaahProgress).toBe("24 Surah + 30 Ayat");
    expect(report.rincianMurojaah.penuh).toContain("Al-Haqqah (4×)");
    expect(report.rincianMurojaah.penuh).toContain("Al-Mulk (2×)");
    expect(report.rincianMurojaah.penuh.join(",")).not.toContain("Juz");
    expect(report.rincianMurojaah.sebagian).toEqual(["Al-Haqqah 1–30"]);
  });
});
