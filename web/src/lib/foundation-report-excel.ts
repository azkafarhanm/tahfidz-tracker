import ExcelJS from "exceljs";
import { finalizeTableSheet } from "@/lib/excel";
import { formatIndonesianDay, formatPeriodLabel, formatSurahDetail } from "@/lib/foundation-report";
import type { FoundationReportData } from "@/lib/foundation-report-data";

export const FOUNDATION_REPORT_TITLE = "LAPORAN PERKEMBANGAN TAHFIDZ SANTRI BOARDING";
const HEADER_ROW = 6;

/**
 * One sheet per grade the teacher holds. Title rows carry the period and the
 * teacher so a sheet still makes sense when printed or forwarded on its own.
 */
export function buildFoundationReportWorkbook(workbook: ExcelJS.Workbook, data: FoundationReportData) {
  const totalHeader = `Total Hafalan s/d ${formatIndonesianDay(data.to)}`;
  const columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Nama Santri", key: "fullName", width: 28 },
    { header: "Setoran Hafalan", key: "hafalanSetoran", width: 11 },
    { header: "Hafalan Baru", key: "hafalanBaru", width: 20 },
    { header: "Rincian Hafalan", key: "rincianHafalan", width: 46 },
    { header: "Setoran Murojaah", key: "murojaahSetoran", width: 11 },
    { header: "Progress Murojaah", key: "murojaahProgress", width: 22 },
    { header: "Rincian Murojaah", key: "rincianMurojaah", width: 52 },
    { header: totalHeader, key: "totalHafalan", width: 22 },
    { header: "Rincian Total Hafalan", key: "rincianTotal", width: 70 },
  ];

  if (data.grades.length === 0) {
    const sheet = workbook.addWorksheet("Laporan");
    sheet.getCell("A1").value = FOUNDATION_REPORT_TITLE;
    sheet.getCell("A2").value = `Periode: ${formatPeriodLabel(data.from, data.to)}`;
    sheet.getCell("A4").value = "Belum ada santri Boarding di halaqah Anda.";
    return;
  }

  for (const grade of data.grades) {
    const sheet = workbook.addWorksheet(`Kelas ${grade.grade}`);
    sheet.columns = columns.map(({ key, width }) => ({ key, width }));
    const titleLines = [
      FOUNDATION_REPORT_TITLE,
      `Periode: ${formatPeriodLabel(data.from, data.to)}`,
      `Guru Pembimbing: ${data.teacherName}`,
      `Kelas ${grade.grade} · Halaqah ${grade.halaqahName}`,
    ];
    titleLines.forEach((line, index) => {
      const row = index + 1;
      sheet.mergeCells(row, 1, row, columns.length);
      const cell = sheet.getCell(row, 1);
      cell.value = line;
      cell.font = { bold: index === 0, size: index === 0 ? 13 : 11 };
    });

    sheet.getRow(HEADER_ROW).values = columns.map((column) => column.header);
    grade.students.forEach((student, index) => {
      const report = student.report;
      sheet.addRow({
        no: index + 1,
        fullName: student.fullName,
        hafalanSetoran: report.hafalanSetoran,
        hafalanBaru: report.hafalanBaru,
        rincianHafalan: formatSurahDetail(report.rincianHafalan),
        murojaahSetoran: report.murojaahSetoran,
        murojaahProgress: report.murojaahProgress,
        rincianMurojaah: formatSurahDetail(report.rincianMurojaah),
        totalHafalan: report.totalHafalan,
        rincianTotal: formatSurahDetail(report.rincianTotal),
      });
    });

    finalizeTableSheet(sheet, {
      headerRow: HEADER_ROW,
      wrapColumns: ["fullName", "hafalanBaru", "rincianHafalan", "murojaahProgress", "rincianMurojaah", "totalHafalan", "rincianTotal"],
      centerColumns: ["no", "hafalanSetoran", "murojaahSetoran"],
    });
    sheet.getRow(HEADER_ROW).height = 32;
    sheet.getRow(HEADER_ROW).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    // Column alignment from the table styling reaches the title rows too; keep
    // the title block flush left.
    titleLines.forEach((_, index) => {
      sheet.getCell(index + 1, 1).alignment = { horizontal: "left", vertical: "middle" };
    });
  }
}
