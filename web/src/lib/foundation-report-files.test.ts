import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildFoundationStudentReport, periodBounds } from "./foundation-report";
import type { FoundationReportData } from "./foundation-report-data";
import { buildFoundationReportWorkbook, FOUNDATION_REPORT_TITLE } from "./foundation-report-excel";
import { buildFoundationReportPdfSections } from "./foundation-report-pdf";
import { surahList } from "./surahs";

const date = new Date("2026-08-10T08:00:00+07:00");
const report = buildFoundationStudentReport(
  [
    { surah: "Al-Ahqaf", fromAyah: 1, toAyah: 35, date },
    { surah: "Al-Fath", fromAyah: 1, toAyah: 28, date },
  ],
  [
    { surah: "Al-Qamar", fromAyah: 1, toAyah: 55, date },
    { surah: "Al-Qamar", fromAyah: 1, toAyah: 55, date },
  ],
  periodBounds("2026-07-13", "2026-09-28"),
);

const data: FoundationReportData = {
  teacherName: "Ustadz Azka",
  from: "2026-07-13",
  to: "2026-09-28",
  grades: [
    { grade: 8, halaqahName: "Ustadz Azka", students: [{ id: "a", fullName: "Ahmad", report }] },
    { grade: 9, halaqahName: "Ustadz Azka", students: [{ id: "b", fullName: "Bilal", report }] },
  ],
};

describe("foundation report Excel", () => {
  it("makes one sheet per grade the teacher holds, and none for other grades", () => {
    const workbook = new ExcelJS.Workbook();
    buildFoundationReportWorkbook(workbook, data);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Kelas 8", "Kelas 9"]);
  });

  it("titles each sheet with the period and teacher and lists surahs by name", () => {
    const workbook = new ExcelJS.Workbook();
    buildFoundationReportWorkbook(workbook, data);
    const sheet = workbook.getWorksheet("Kelas 8")!;
    expect(sheet.getCell("A1").value).toBe(FOUNDATION_REPORT_TITLE);
    expect(sheet.getCell("A2").value).toBe("Periode: 13 Juli 2026 – 28 September 2026");
    expect(sheet.getCell("A3").value).toBe("Guru Pembimbing: Ustadz Azka");
    expect(sheet.getCell("I6").value).toBe("Total Hafalan s/d 28 September 2026");
    expect(sheet.getCell("J6").value).toBe("Rincian Total Hafalan");
    const values = (sheet.getRow(7).values as unknown[]).slice(1);
    expect(values.slice(0, 9)).toEqual([
      1,
      "Ahmad",
      2,
      "2 Surah + 28 Ayat",
      // Al-Ahqaf then Al-Fath: Muhammad lies between them in juz 26, so it is
      // counted as recited.
      "Penuh: Al-Ahqaf, Muhammad\nSebagian: Al-Fath 1–28",
      2,
      "2 Surah",
      "Penuh: Al-Qamar (2×)",
      "4 Juz + 2 Surah + 28 Ayat",
    ]);
    // The total's surahs are spelled out, juz 30–27 included, with no markers.
    const totalDetail = String(values[9]);
    expect(totalDetail.startsWith("Penuh: Al-Ahqaf, Muhammad, At-Tur, An-Najm")).toBe(true);
    expect(totalDetail).toContain("An-Naba");
    expect(totalDetail.endsWith("Sebagian: Al-Fath 1–28; Adz-Dzariyat 31–60")).toBe(true);
    expect(JSON.stringify(values)).not.toContain("*");
  });

  it("adds no footnote below the table", () => {
    const workbook = new ExcelJS.Workbook();
    buildFoundationReportWorkbook(workbook, data);
    const sheet = workbook.getWorksheet("Kelas 8")!;
    expect(sheet.rowCount).toBe(7);
  });

  it("explains an empty report instead of producing blank sheets", () => {
    const workbook = new ExcelJS.Workbook();
    buildFoundationReportWorkbook(workbook, { ...data, grades: [] });
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Laporan"]);
    expect(String(workbook.getWorksheet("Laporan")!.getCell("A4").value)).toContain("Belum ada santri Boarding");
  });
});

describe("foundation report PDF", () => {
  it("opens with the period and teacher and has no signature block", () => {
    const sections = buildFoundationReportPdfSections(data);
    expect(sections.slice(0, 3)).toEqual([
      { type: "title", text: "Laporan Perkembangan Tahfidz Santri Boarding" },
      { type: "text", text: "Periode: 13 Juli 2026 – 28 September 2026" },
      { type: "text", text: "Guru Pembimbing: Ustadz Azka" },
    ]);
    expect(JSON.stringify(sections)).not.toMatch(/tanda tangan/i);
  });

  it("writes one block per student with the surah detail under each total", () => {
    const blocks = buildFoundationReportPdfSections(data).filter((section) => section.type === "block");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      type: "block",
      heading: "Ahmad",
      meta: "Kelas 8",
      rows: [
        { label: "Hafalan baru", value: "2 Surah + 28 Ayat (2 setoran)" },
        { label: "Penuh", value: "Al-Ahqaf, Muhammad", indent: true },
        { label: "Sebagian", value: "Al-Fath 1–28", indent: true },
        { label: "Murojaah", value: "2 Surah (2 setoran)" },
        { label: "Penuh", value: "Al-Qamar (2×)", indent: true },
        { label: "Total hafalan", value: "4 Juz + 2 Surah + 28 Ayat (sampai 28 September 2026)" },
        {
          label: "Penuh",
          value: ["Al-Ahqaf", "Muhammad", ...surahList.filter((surah) => surah.number >= 52).map((surah) => surah.name)].join(", "),
          indent: true,
        },
        { label: "Sebagian", value: "Al-Fath 1–28; Adz-Dzariyat 31–60", indent: true },
      ],
    });
  });

  it("carries no asterisk or footnote", () => {
    expect(JSON.stringify(buildFoundationReportPdfSections(data))).not.toContain("*");
  });
});
