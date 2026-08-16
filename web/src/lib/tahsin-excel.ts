import ExcelJS from "exceljs";
import type { Semester } from "@/generated/prisma-next/enums";
import { finalizeTableSheet } from "@/lib/excel";
import type { getTahsinExportData } from "@/lib/tahsin";
import { formatTahsinPageRange } from "@/lib/tahsin";
import { statusLabels } from "@/lib/format";
import { semesterLabel } from "@/lib/summative";

type TahsinExportData = Awaited<ReturnType<typeof getTahsinExportData>>;

export type TahsinWorkbookInput = {
  academicYear: string;
  classLevel: number;
  semester: Semester;
  schoolName: string;
  exportData: TahsinExportData;
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function buildTahsinWorkbook(
  workbook: ExcelJS.Workbook,
  input: TahsinWorkbookInput,
) {
  const sheet = workbook.addWorksheet("Penilaian Tahsin");
  sheet.columns = [
    { key: "no", width: 6 },
    { key: "studentName", width: 28 },
    { key: "className", width: 14 },
    { key: "meeting", width: 24 },
    { key: "jilid", width: 10 },
    { key: "pageRange", width: 12 },
    { key: "score", width: 10 },
    { key: "status", width: 20 },
    { key: "notes", width: 38 },
  ];

  const titleEndColumn = sheet.columnCount;
  for (let rowNumber = 1; rowNumber <= 5; rowNumber += 1) {
    sheet.mergeCells(rowNumber, 1, rowNumber, titleEndColumn);
    sheet.getCell(rowNumber, 1).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  }

  sheet.getCell("A1").value = "PENILAIAN TAHSIN";
  sheet.getCell("A1").font = { bold: true, size: 12, name: "Calibri" };
  sheet.getCell("A2").value = "METODE ILMAN WA RUUHAN";
  sheet.getCell("A2").font = { bold: true, size: 11, name: "Calibri" };
  sheet.getCell("A3").value = input.schoolName;
  sheet.getCell("A4").value = `TAHUN AJARAN ${input.academicYear}`;
  sheet.getCell("A5").value = `SEMESTER ${semesterLabel(input.semester).toUpperCase()} - KELAS ${input.classLevel}`;
  sheet.getRow(7).values = [
    "No",
    "Nama Santri",
    "Kelas",
    "Penilaian / Pertemuan",
    "Jilid",
    "Halaman",
    "Nilai",
    "Status",
    "Catatan Mutabaah",
  ];

  const studentsById = new Map(
    input.exportData.students.map((student) => [student.id, student]),
  );
  const records = [...input.exportData.records].sort(
    (left, right) =>
      left.date.getTime() - right.date.getTime() ||
      left.createdAt.getTime() - right.createdAt.getTime() ||
      left.id.localeCompare(right.id),
  );

  for (const [index, record] of records.entries()) {
    const student = studentsById.get(record.studentId);
    sheet.addRow({
      no: index + 1,
      studentName: student?.fullName ?? "-",
      className: student?.academicClass?.name ?? "-",
      meeting: `Pertemuan ${index + 1}\n(${dateFormatter.format(record.date)})`,
      jilid: record.jilid,
      pageRange: formatTahsinPageRange(record.startPage, record.endPage),
      score: record.score,
      status: statusLabels[record.status],
      notes: record.notes ?? "",
    });
  }

  if (records.length === 0) {
    sheet.mergeCells(8, 1, 8, titleEndColumn);
    const emptyCell = sheet.getCell(8, 1);
    emptyCell.value = "Belum ada penilaian Tahsin untuk filter ini.";
    emptyCell.alignment = { horizontal: "center", vertical: "middle" };
  }

  finalizeTableSheet(sheet, {
    headerRow: 7,
    wrapColumns: ["studentName", "meeting", "status", "notes"],
    centerColumns: ["no", "className", "jilid", "pageRange", "score"],
  });
}
