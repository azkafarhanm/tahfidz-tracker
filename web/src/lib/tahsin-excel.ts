import ExcelJS from "exceljs";
import type { Semester } from "@/generated/prisma-next/enums";
import { finalizeTableSheet } from "@/lib/excel";
import type { getTahsinExportData } from "@/lib/tahsin";
import { formatTahsinPageRange } from "@/lib/tahsin";
import { semesterLabel } from "@/lib/summative";

type TahsinExportData = Awaited<ReturnType<typeof getTahsinExportData>>;
export type TahsinWorkbookInput = { academicYear: string; classLevel: number; semester: Semester; schoolName: string; exportData: TahsinExportData };
const statusLabels = { LANCAR: "Lancar", CUKUP: "Cukup", PERLU_MUROJAAH: "Perlu Murojaah" } as const;
const classNames = ["7A", "7B", "7C"] as const;

function latestByMeeting(records: TahsinExportData["records"]) {
  const latest = new Map<string, TahsinExportData["records"][number]>();
  for (const record of [...records].sort((a, b) => b.date.getTime() - a.date.getTime() || b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))) {
    if (record.meeting?.meetingNumber != null && !latest.has(`${record.studentId}:${record.meeting.meetingNumber}`)) latest.set(`${record.studentId}:${record.meeting.meetingNumber}`, record);
  }
  return latest;
}

function meetingCell(record: TahsinExportData["records"][number]) {
  return `J${record.jilid} \u00b7 ${formatTahsinPageRange(record.startPage, record.endPage)}\n${record.score ?? "-"} \u00b7 ${statusLabels[record.status]}${record.notes ? `\n${record.notes}` : ""}`;
}

export function buildTahsinWorkbook(workbook: ExcelJS.Workbook, input: TahsinWorkbookInput) {
  const latest = latestByMeeting(input.exportData.records);
  const maxMeeting = Math.max(0, ...[...latest.values()].map((record) => record.meeting?.meetingNumber ?? 0));
  const meetingColumns = Array.from({ length: maxMeeting }, (_, index) => `P${index + 1}`);
  const studentsByClass = new Map(classNames.map((name) => [name, input.exportData.students.filter((student) => student.academicClass?.name === name)]));
  for (const className of classNames) {
    const sheet = workbook.addWorksheet(className);
    const headers = ["No", "Nama", "Kelas", ...meetingColumns, "Rerata", "Ket", "Catatan Mutabaah"];
    const rerataIndex = 3 + meetingColumns.length;
    const notesIndex = headers.length - 1;
    sheet.columns = headers.map((_, index) => ({ key: `column${index}`, width: index === 0 ? 5 : index === 1 ? 28 : index === 2 ? 8 : index >= 3 && index < rerataIndex ? 20 : index === rerataIndex ? 10 : index === notesIndex ? 38 : 14 }));
    for (let row = 1; row <= 5; row += 1) sheet.mergeCells(row, 1, row, headers.length);
    sheet.getCell("A1").value = "PENILAIAN TAHSIN";
    sheet.getCell("A2").value = "METODE ILMAN WA RUUHAN";
    sheet.getCell("A3").value = input.schoolName;
    sheet.getCell("A4").value = `TAHUN AJARAN ${input.academicYear}`;
    sheet.getCell("A5").value = `SEMESTER ${semesterLabel(input.semester).toUpperCase()} - KELAS ${className}`;
    sheet.getRow(7).values = headers;
    for (const [index, student] of (studentsByClass.get(className) ?? []).entries()) {
      const values: (string | number | null)[] = [index + 1, student.fullName, className];
      const scores: number[] = [];
      for (let meetingNumber = 1; meetingNumber <= maxMeeting; meetingNumber += 1) {
        const record = latest.get(`${student.id}:${meetingNumber}`);
        values.push(record ? meetingCell(record) : "");
        if (record?.score != null) scores.push(record.score);
      }
      values.push(scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null, "", "");
      sheet.addRow(values);
    }
    if ((studentsByClass.get(className) ?? []).length === 0) { sheet.mergeCells(8, 1, 8, headers.length); sheet.getCell("A8").value = "Belum ada santri untuk kelas ini."; }
    const meetingKeys = meetingColumns.map((_, i) => `column${i + 3}`);
    finalizeTableSheet(sheet, { headerRow: 7, wrapColumns: ["column1", ...meetingKeys, `column${headers.length - 1}`], centerColumns: ["column0", "column2"] });
    sheet.getRow(7).height = 32;
    sheet.getRow(7).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    for (const key of meetingKeys) sheet.getColumn(key).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    sheet.views = [{ state: "frozen", ySplit: 7, xSplit: 3 }];
  }
}
