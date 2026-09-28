import ExcelJS from "exceljs";
import { Semester } from "@/generated/prisma-next/enums";
import { finalizeTableSheet } from "@/lib/excel";
import type { getTeacherFormativeExportData } from "@/lib/formative";
import { formatRange, statusLabels } from "@/lib/format";
import { resolveHafalanTimeline } from "@/lib/hafalan-sequence";
import { buildAyahCounts, formatHafalanSummary, formatMurojaahSummary } from "@/lib/quran-progress";
import { buildFormativeWorkbook } from "@/lib/summative-excel";
import { semesterLabel } from "@/lib/summative";
import { getJakartaDayKey } from "@/lib/jakarta-date";

const jakartaDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

type FormativeExportData = Awaited<
  ReturnType<typeof getTeacherFormativeExportData>
>;

type FormativeExportRow = FormativeExportData["rows"][number];
type ScoredFormativeExportRow = FormativeExportRow & { score: number };
type FormativeRecordType = FormativeExportRow["type"];

export type AcademicFormativeWorkbookInput = {
  academicYear: string;
  classLevel: number;
  semester: Semester;
  schoolName: string;
  exportData: FormativeExportData;
  meetingTimeline: readonly (string | null)[];
  sheetNamePrefix?: string;
};

export type FormativeTableWorkbookInput = {
  academicYear: string;
  classLevel?: number;
  semester: Semester;
  programLabel: string;
  exportData: FormativeExportData;
  sheetNamePrefix?: string;
};

export type BoardingFormativeProgressWorkbookInput = {
  exportData: FormativeExportData;
  sheetNamePrefix?: string;
};

export function buildAcademicFormativeWorkbook(
  workbook: ExcelJS.Workbook,
  input: AcademicFormativeWorkbookInput,
) {
  const studentSummary = summarizeFormativeRows(input.exportData.rows);
  const { meetingCount, scoresByStudent } = buildMeetingScores(
    input.exportData.rows,
    input.meetingTimeline,
  );

  buildFormativeWorkbook(workbook, {
    academicYear: input.academicYear,
    classLevel: input.classLevel,
    semester: input.semester,
    schoolName: input.schoolName,
    students: input.exportData.students.map((student) => {
      const summary = studentSummary.get(student.id);
      return {
        id: student.id,
        fullName: student.fullName,
        academicClassName: student.academicClass?.name ?? "-",
        averageScore:
          summary && summary.scoredCount > 0
            ? Math.round((summary.totalScore / summary.scoredCount) * 10) / 10
            : null,
      };
    }),
    rows: input.exportData.rows,
    scoresByStudent,
    meetingCount,
    meetingDates: input.meetingTimeline,
    sheetNamePrefix: input.sheetNamePrefix,
  });
}

export function buildFormativeTableWorkbook(
  workbook: ExcelJS.Workbook,
  input: FormativeTableWorkbookInput,
) {
  const { exportData, programLabel } = input;
  const isBoarding = programLabel === "Boarding";
  const studentsById = new Map(
    exportData.students.map((student) => [student.id, student]),
  );
  const studentSummary = summarizeFormativeRows(exportData.rows);

  const infoSheet = workbook.addWorksheet(
    uniqueSheetName(workbook, `${input.sheetNamePrefix ?? ""}Info`),
  );
  infoSheet.columns = [
    { header: "Keterangan", key: "key", width: 26 },
    { header: "Nilai", key: "value", width: 24 },
  ];
  [
    { key: "Program", value: programLabel },
    { key: "Tahun ajaran", value: input.academicYear },
    { key: "Kelas", value: input.classLevel ?? "Semua" },
    { key: "Semester", value: semesterLabel(input.semester) },
    { key: "Jumlah santri", value: exportData.students.length },
    { key: "Jumlah catatan", value: exportData.rows.length },
  ].forEach((row) => infoSheet.addRow(row));
  finalizeTableSheet(infoSheet);

  const summarySheet = workbook.addWorksheet(
    uniqueSheetName(workbook, `${input.sheetNamePrefix ?? ""}Ringkasan`),
  );
  summarySheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    {
      header: isBoarding ? "Kelas Boarding" : "Kelas Akademik",
      key: "academicClassName",
      width: 18,
    },
    { header: "Halaqah", key: "halaqahName", width: 24 },
    { header: "Hafalan", key: "hafalanCount", width: 12 },
    { header: "Murojaah", key: "murojaahCount", width: 12 },
    { header: "Total Catatan", key: "totalCount", width: 14 },
    { header: "Skor Tercatat", key: "scoredCount", width: 14 },
    { header: "Nilai Terakhir", key: "latestScore", width: 14 },
    { header: "Rata-rata Santri", key: "averageScore", width: 16 },
  ];

  exportData.students.forEach((student, index) => {
    const summary = studentSummary.get(student.id);
    const averageScore =
      summary && summary.scoredCount > 0
        ? Math.round((summary.totalScore / summary.scoredCount) * 10) / 10
        : "-";

    summarySheet.addRow({
      no: index + 1,
      studentName: student.fullName,
      academicClassName: student.academicClass?.name ?? "-",
      halaqahName: student.classGroup.name,
      hafalanCount: summary?.hafalanCount ?? 0,
      murojaahCount: summary?.murojaahCount ?? 0,
      totalCount: summary?.totalCount ?? 0,
      scoredCount: summary?.scoredCount ?? 0,
      latestScore: summary?.latestScore ?? "-",
      averageScore,
    });
  });
  finalizeTableSheet(summarySheet, {
    centerColumns: [
      "no",
      "hafalanCount",
      "murojaahCount",
      "totalCount",
      "scoredCount",
      "latestScore",
      "averageScore",
    ],
  });

  const dailyScoreSheet = workbook.addWorksheet(
    uniqueSheetName(workbook, `${input.sheetNamePrefix ?? ""}Skor Harian`),
  );
  dailyScoreSheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Kelas Akademik", key: "academicClassName", width: 18 },
    { header: "Halaqah", key: "halaqahName", width: 26 },
    { header: "Tanggal", key: "date", width: 18 },
    { header: "Jenis", key: "type", width: 12 },
    { header: "Materi", key: "range", width: 28 },
    { header: "Nilai", key: "score", width: 10 },
    { header: "Status", key: "status", width: 18 },
  ];

  exportData.rows
    .filter((row): row is ScoredFormativeExportRow => row.score !== null)
    .forEach((row, index) => {
      const student = studentsById.get(row.studentId);

      dailyScoreSheet.addRow({
        no: index + 1,
        studentName: row.studentName,
        academicClassName: student?.academicClass?.name ?? "-",
        halaqahName: student?.classGroup.name ?? "-",
        date: jakartaDateFormatter.format(row.date),
        type: row.type,
        range: formatRange(row.surah, row.fromAyah, row.toAyah),
        score: row.score,
        status: statusLabels[row.status],
      });
    });
  finalizeTableSheet(dailyScoreSheet, {
    wrapColumns: ["studentName", "halaqahName", "range", "status"],
    centerColumns: ["no", "score"],
  });

  const detailSheet = workbook.addWorksheet(
    uniqueSheetName(workbook, `${input.sheetNamePrefix ?? ""}Detail Formatif`),
  );
  detailSheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Kelas Akademik", key: "academicClassName", width: 18 },
    { header: "Halaqah", key: "halaqahName", width: 24 },
    { header: "Jenis", key: "type", width: 12 },
    { header: "Materi", key: "range", width: 28 },
    { header: "Nilai", key: "score", width: 10 },
    { header: "Status", key: "status", width: 18 },
    { header: "Tanggal", key: "date", width: 16 },
    { header: "Catatan", key: "notes", width: 30 },
  ];

  exportData.rows.forEach((row, index) => {
    const student = studentsById.get(row.studentId);

    detailSheet.addRow({
      no: index + 1,
      studentName: row.studentName,
      academicClassName: student?.academicClass?.name ?? "-",
      halaqahName: student?.classGroup.name ?? "-",
      type: row.type,
      range: formatRange(row.surah, row.fromAyah, row.toAyah),
      score: row.score ?? "",
      status: statusLabels[row.status],
      date: jakartaDateFormatter.format(row.date),
      notes: row.notes ?? "",
    });
  });
  finalizeTableSheet(detailSheet, {
    wrapColumns: ["studentName", "halaqahName", "range", "status", "notes"],
    centerColumns: ["no", "score"],
  });
}

export function buildBoardingFormativeProgressWorkbook(
  workbook: ExcelJS.Workbook,
  input: BoardingFormativeProgressWorkbookInput,
) {
  for (const classLevel of [7, 8, 9]) {
    const studentIds = new Set(
      input.exportData.students
        .filter((student) => student.classGroup.grade === classLevel)
        .map((student) => student.id),
    );

    addBoardingProgressSheet(workbook, {
      students: input.exportData.students.filter((student) =>
        studentIds.has(student.id),
      ),
      rows: input.exportData.rows.filter((row) => studentIds.has(row.studentId)),
      sheetName: uniqueSheetName(
        workbook,
        `${input.sheetNamePrefix ?? ""}Kelas ${classLevel}`,
      ),
    });
  }
}

function addBoardingProgressSheet(
  workbook: ExcelJS.Workbook,
  input: FormativeExportData & { sheetName: string },
) {
  const rowsByStudent = groupRowsByStudent(input.rows);
  const sheet = workbook.addWorksheet(input.sheetName);

  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Santri", key: "studentName", width: 30 },
    { header: "Kelas", key: "classLevel", width: 10 },
    { header: "Halaqah", key: "halaqahName", width: 24 },
    { header: "Total Setoran Hafalan", key: "hafalanCount", width: 22 },
    { header: "Total Setoran Murojaah", key: "murojaahCount", width: 24 },
    { header: "Progress Hafalan", key: "hafalanProgress", width: 24 },
    { header: "Progress Murojaah", key: "murojaahProgress", width: 24 },
    { header: "Setoran Terakhir", key: "latestRange", width: 28 },
    { header: "Tanggal Terakhir", key: "latestDate", width: 18 },
  ];

  input.students.forEach((student, index) => {
    const studentRows = rowsByStudent.get(student.id) ?? [];
    const hafalanRows = filterRowsByType(studentRows, "Hafalan");
    const murojaahRows = filterRowsByType(studentRows, "Murojaah");
    const latestRow = studentRows[0];
    const hafalanProgress = formatHafalanProgress(hafalanRows);

    sheet.addRow({
      no: index + 1,
      studentName: student.fullName,
      classLevel: student.classGroup.grade,
      halaqahName: student.classGroup.name,
      hafalanCount: hafalanRows.length,
      murojaahCount: murojaahRows.length,
      hafalanProgress,
      murojaahProgress: formatMurojaahProgress(murojaahRows),
      latestRange: latestRow ? formatSetoranRange(latestRow) : "-",
      latestDate: latestRow ? jakartaDateFormatter.format(latestRow.date) : "-",
    });
  });

  finalizeTableSheet(sheet, {
    wrapColumns: [
      "studentName",
      "halaqahName",
      "hafalanProgress",
      "murojaahProgress",
      "latestRange",
    ],
    centerColumns: [
      "no",
      "classLevel",
      "hafalanCount",
      "murojaahCount",
      "latestDate",
    ],
  });

}

function isLaterScoredRecord(
  candidate: ScoredFormativeExportRow,
  current: ScoredFormativeExportRow,
) {
  return (
    candidate.updatedAt.getTime() - current.updatedAt.getTime() ||
    candidate.createdAt.getTime() - current.createdAt.getTime() ||
    candidate.date.getTime() - current.date.getTime() ||
    candidate.id.localeCompare(current.id)
  ) > 0;
}

function buildMeetingScores(
  rows: FormativeExportRow[],
  meetingTimeline: readonly (string | null)[],
) {
  const meetingIndexByDay = new Map(
    meetingTimeline.flatMap((dayKey, index) =>
      dayKey === null ? [] : [[dayKey, index] as const],
    ),
  );
  const latestScoredRowsByStudentAndDay = new Map<
    string,
    ScoredFormativeExportRow
  >();

  for (const row of rows) {
    if (row.score === null) continue;

    const dayKey = getJakartaDayKey(row.date);
    const scoredRow: ScoredFormativeExportRow = { ...row, score: row.score };
    const scoreKey = `${row.studentId}:${dayKey}`;
    const current = latestScoredRowsByStudentAndDay.get(scoreKey);
    if (!current || isLaterScoredRecord(scoredRow, current)) {
      latestScoredRowsByStudentAndDay.set(scoreKey, scoredRow);
    }
  }

  const scoresByStudent = new Map<string, Array<number | "">>();
  for (const row of latestScoredRowsByStudentAndDay.values()) {
    const dayKey = getJakartaDayKey(row.date);
    const meetingIndex = meetingIndexByDay.get(dayKey);
    if (meetingIndex === undefined) continue;

    const scores =
      scoresByStudent.get(row.studentId) ??
      Array.from({ length: meetingTimeline.length }, () => "");
    scores[meetingIndex] = row.score;
    scoresByStudent.set(row.studentId, scores);
  }

  return { meetingCount: meetingTimeline.length, scoresByStudent };
}

function summarizeFormativeRows(rows: FormativeExportRow[]) {
  const studentSummary = new Map<
    string,
    {
      totalCount: number;
      hafalanCount: number;
      murojaahCount: number;
      scoredCount: number;
      totalScore: number;
      latestScore: number | null;
      latestScoreDate: Date | null;
    }
  >();

  for (const row of rows) {
    const current = studentSummary.get(row.studentId) ?? {
      totalCount: 0,
      hafalanCount: 0,
      murojaahCount: 0,
      scoredCount: 0,
      totalScore: 0,
      latestScore: null,
      latestScoreDate: null,
    };

    current.totalCount += 1;
    if (row.type === "Hafalan") {
      current.hafalanCount += 1;
    } else {
      current.murojaahCount += 1;
    }

    if (row.score !== null) {
      current.scoredCount += 1;
      current.totalScore += row.score;
      if (
        !current.latestScoreDate ||
        row.date.getTime() > current.latestScoreDate.getTime()
      ) {
        current.latestScore = row.score;
        current.latestScoreDate = row.date;
      }
    }

    studentSummary.set(row.studentId, current);
  }

  return studentSummary;
}

function groupRowsByStudent(rows: FormativeExportRow[]) {
  const grouped = new Map<string, FormativeExportRow[]>();

  for (const row of rows) {
    const studentRows = grouped.get(row.studentId) ?? [];
    studentRows.push(row);
    grouped.set(row.studentId, studentRows);
  }

  for (const studentRows of grouped.values()) {
    studentRows.sort(compareNewestRecord);
  }

  return grouped;
}

function filterRowsByType(rows: FormativeExportRow[], type: FormativeRecordType) {
  return rows.filter((row) => row.type === type);
}

function compareNewestRecord(left: FormativeExportRow, right: FormativeExportRow) {
  return (
    right.date.getTime() - left.date.getTime() ||
    right.updatedAt.getTime() - left.updatedAt.getTime() ||
    right.createdAt.getTime() - left.createdAt.getTime() ||
    right.id.localeCompare(left.id)
  );
}

function formatSetoranRange(row: FormativeExportRow) {
  return row.fromAyah === row.toAyah
    ? `${row.surah} ${row.fromAyah}`
    : `${row.surah} ${row.fromAyah}-${row.toAyah}`;
}

/**
 * Semester hafalan, with forgotten ayat recovered from the memorisation order
 * so it agrees with the foundation report.
 */
function formatHafalanProgress(rows: FormativeExportRow[]) {
  return formatHafalanSummary(resolveHafalanTimeline(rows).ayat);
}

/** Semester murojaah, counted the same way as the foundation report. */
function formatMurojaahProgress(rows: FormativeExportRow[]) {
  return formatMurojaahSummary(buildAyahCounts(rows, { deduplicate: false }));
}

function uniqueSheetName(workbook: ExcelJS.Workbook, rawName: string) {
  const baseName = safeSheetName(rawName);
  const usedNames = new Set(
    workbook.worksheets.map((sheet) => sheet.name.toLowerCase()),
  );
  let candidate = baseName;
  let suffix = 2;

  while (usedNames.has(candidate.toLowerCase())) {
    const suffixText = ` ${suffix}`;
    candidate = `${baseName.slice(0, 31 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  return candidate;
}

function safeSheetName(name: string) {
  const cleaned = name.replace(/[\\/*?:[\]]/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || "Sheet").slice(0, 31);
}
