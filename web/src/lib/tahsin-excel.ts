import ExcelJS from "exceljs";
import type { Semester } from "@/generated/prisma-next/enums";
import { finalizeTableSheet } from "@/lib/excel";
import type { getTahsinExportData } from "@/lib/tahsin";
import { describeTahsinMaterial, formatTahsinRange, tahsinRecordMeetingNumber } from "@/lib/tahsin-material";
import { semesterLabel } from "@/lib/summative";

type TahsinExportData = Awaited<ReturnType<typeof getTahsinExportData>>;
type TahsinExportRecord = TahsinExportData["records"][number];
export type TahsinWorkbookInput = { academicYear: string; classLevel: number; semester: Semester; schoolName: string; exportData: TahsinExportData };
const statusLabels = { LANCAR: "Lancar", CUKUP: "Cukup", PERLU_MUROJAAH: "Perlu Murojaah" } as const;
/** Grade 7 always lists its three rombel, even before any of them has a student. */
const grade7ClassNames = ["7A", "7B", "7C"] as const;
const shortIndonesianMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"] as const;

function isQuranRecord(record: TahsinExportRecord) {
  return record.material === "QURAN";
}

function latestByMeeting(records: TahsinExportData["records"]) {
  const latest = new Map<string, TahsinExportRecord>();
  for (const record of [...records].sort((a, b) => b.date.getTime() - a.date.getTime() || b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))) {
    const meetingNumber = tahsinRecordMeetingNumber(record);
    if (meetingNumber != null && !latest.has(`${record.studentId}:${meetingNumber}`)) latest.set(`${record.studentId}:${meetingNumber}`, record);
  }
  return latest;
}

function materialLine(record: TahsinExportRecord) {
  return isQuranRecord(record)
    ? describeTahsinMaterial(record)
    : `J${record.jilid} · ${formatTahsinRange(record.startPage ?? 0, record.endPage)}`;
}

function meetingCell(record: TahsinExportRecord) {
  return `${materialLine(record)}\n${record.score ?? "-"} · ${statusLabels[record.status]}${record.notes ? `\n${record.notes}` : ""}`;
}

function meetingHeader(meetingNumber: number, meetingDate: Date | undefined) {
  if (!meetingDate) return `P${meetingNumber}`;
  return `P${meetingNumber}\n(${meetingDate.getUTCDate()} ${shortIndonesianMonths[meetingDate.getUTCMonth()]})`;
}

function sheetClassNames(input: TahsinWorkbookInput) {
  if (input.classLevel === 7) return [...grade7ClassNames];
  const names = [...new Set(input.exportData.students.map((student) => student.academicClass?.name).filter((name): name is string => Boolean(name)))].sort();
  return names.length > 0 ? names : [`Kelas ${input.classLevel}`];
}

export function buildTahsinWorkbook(workbook: ExcelJS.Workbook, input: TahsinWorkbookInput) {
  const latest = latestByMeeting(input.exportData.records);
  const isQuran = input.exportData.material === "QURAN";
  // Header and cells come from the same list, so a gap in meeting numbers can
  // never shift a student's cells out from under their header.
  const meetings = [...input.exportData.meetings].sort((left, right) => left.meetingNumber - right.meetingNumber);
  const meetingColumns = meetings.map((meeting) => meetingHeader(meeting.meetingNumber, meeting.meetingDate));
  const classNames = sheetClassNames(input);
  const studentsByClass = new Map(classNames.map((name) => [name, input.exportData.students.filter((student) => (student.academicClass?.name ?? `Kelas ${input.classLevel}`) === name)]));
  for (const className of classNames) {
    const sheet = workbook.addWorksheet(className);
    const headers = ["No", "Nama", "Kelas", ...meetingColumns, "Rerata", "Ket", "Catatan Mutabaah"];
    const rerataIndex = 3 + meetingColumns.length;
    const notesIndex = headers.length - 1;
    sheet.columns = headers.map((_, index) => ({ key: `column${index}`, width: index === 0 ? 5 : index === 1 ? 28 : index === 2 ? 8 : index >= 3 && index < rerataIndex ? (isQuran ? 24 : 20) : index === rerataIndex ? 10 : index === notesIndex ? 38 : 14 }));
    for (let row = 1; row <= 5; row += 1) sheet.mergeCells(row, 1, row, headers.length);
    sheet.getCell("A1").value = isQuran ? "PENILAIAN TAHSIN AL-QUR'AN" : "PENILAIAN TAHSIN";
    sheet.getCell("A2").value = isQuran ? "BACAAN AL-QUR'AN BERURUTAN" : "METODE ILMAN WA RUUHAN";
    sheet.getCell("A3").value = input.schoolName;
    sheet.getCell("A4").value = `TAHUN AJARAN ${input.academicYear}`;
    sheet.getCell("A5").value = `SEMESTER ${semesterLabel(input.semester).toUpperCase()} - KELAS ${className.replace(/^Kelas /, "")}`;
    sheet.getRow(7).values = headers;
    for (const [index, student] of (studentsByClass.get(className) ?? []).entries()) {
      const values: (string | number | null)[] = [index + 1, student.fullName, className];
      const scores: number[] = [];
      for (const meeting of meetings) {
        const record = latest.get(`${student.id}:${meeting.meetingNumber}`);
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
    sheet.getColumn(rerataIndex + 1).numFmt = "0.0";
    sheet.views = [{ state: "frozen", ySplit: 7, xSplit: 3 }];
  }
}
