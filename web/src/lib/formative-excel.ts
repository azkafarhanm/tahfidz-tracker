import ExcelJS from "exceljs";
import { Semester } from "@/generated/prisma-next/enums";
import { finalizeTableSheet } from "@/lib/excel";
import type { getTeacherFormativeExportData } from "@/lib/formative";
import { formatRange, statusLabels } from "@/lib/format";
import { getJuz } from "@/lib/juz";
import { surahList } from "@/lib/surahs";
import { buildFormativeWorkbook } from "@/lib/summative-excel";
import { semesterLabel } from "@/lib/summative";

const jakartaDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
const jakartaDayFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Jakarta",
  year: "numeric",
});

type FormativeExportData = Awaited<
  ReturnType<typeof getTeacherFormativeExportData>
>;

type FormativeExportRow = FormativeExportData["rows"][number];
type ScoredFormativeExportRow = FormativeExportRow & { score: number };
type FormativeRecordType = FormativeExportRow["type"];
type ProgressUnit = "juz" | "surah";

export type AcademicFormativeWorkbookInput = {
  academicYear: string;
  classLevel: number;
  semester: Semester;
  schoolName: string;
  exportData: FormativeExportData;
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
};

export function buildAcademicFormativeWorkbook(
  workbook: ExcelJS.Workbook,
  input: AcademicFormativeWorkbookInput,
) {
  const studentSummary = summarizeFormativeRows(input.exportData.rows);
  const { meetingCount, scoresByStudent } = buildMeetingScores(
    input.exportData.rows,
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
  const rowsByStudent = groupRowsByStudent(input.exportData.rows);
  const sheet = workbook.addWorksheet("Progress Boarding");

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

  input.exportData.students.forEach((student, index) => {
    const studentRows = rowsByStudent.get(student.id) ?? [];
    const hafalanRows = filterRowsByType(studentRows, "Hafalan");
    const murojaahRows = filterRowsByType(studentRows, "Murojaah");
    const latestRow = studentRows[0];

    sheet.addRow({
      no: index + 1,
      studentName: student.fullName,
      classLevel: student.classGroup.grade,
      halaqahName: student.classGroup.name,
      hafalanCount: hafalanRows.length,
      murojaahCount: murojaahRows.length,
      hafalanProgress: formatProgress(hafalanRows, { deduplicate: true }),
      murojaahProgress: formatProgress(murojaahRows, { deduplicate: false }),
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

function getJakartaDayKey(date: Date) {
  const parts = new Map(
    jakartaDayFormatter
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.get("year")}-${parts.get("month")}-${parts.get("day")}`;
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

function buildMeetingScores(rows: FormativeExportRow[]) {
  const meetingsByStudentAndDay = new Map<
    string,
    Map<string, ScoredFormativeExportRow | null>
  >();

  for (const row of rows) {
    const dayKey = getJakartaDayKey(row.date);
    const byDay = meetingsByStudentAndDay.get(row.studentId) ?? new Map();
    if (!byDay.has(dayKey)) {
      byDay.set(dayKey, null);
    }
    meetingsByStudentAndDay.set(row.studentId, byDay);
    if (row.score === null) continue;

    const scoredRow: ScoredFormativeExportRow = { ...row, score: row.score };
    const current = byDay.get(dayKey);
    if (!current || isLaterScoredRecord(scoredRow, current)) {
      byDay.set(dayKey, scoredRow);
    }
  }

  const scoresByStudent = new Map<string, Array<number | "">>();
  let meetingCount = 0;
  for (const [studentId, byDay] of meetingsByStudentAndDay) {
    const scores = [...byDay.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, row]) => row?.score ?? "");
    scoresByStudent.set(studentId, scores);
    meetingCount = Math.max(meetingCount, scores.length);
  }

  return { meetingCount, scoresByStudent };
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

function formatProgress(
  rows: FormativeExportRow[],
  options: { deduplicate: boolean },
) {
  const ayahCounts = buildAyahCounts(rows, options);
  const counts = summarizeAyahCounts(ayahCounts);
  const parts = [
    counts.juz > 0 ? `${counts.juz} Juz` : null,
    counts.surah > 0 ? `${counts.surah} Surah` : null,
    counts.ayah > 0 ? `${counts.ayah} Ayat` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" + ") : "0 Ayat";
}

function buildAyahCounts(
  rows: FormativeExportRow[],
  options: { deduplicate: boolean },
) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const maxAyah = surahAyahCountByName.get(row.surah) ?? row.toAyah;
    const fromAyah = Math.max(1, Math.min(row.fromAyah, maxAyah));
    const toAyah = Math.max(fromAyah, Math.min(row.toAyah, maxAyah));

    for (let ayah = fromAyah; ayah <= toAyah; ayah += 1) {
      const key = ayahKey(row.surah, ayah);
      counts.set(key, options.deduplicate ? 1 : (counts.get(key) ?? 0) + 1);
    }
  }

  return counts;
}

function summarizeAyahCounts(ayahCounts: Map<string, number>) {
  const remaining = new Map(ayahCounts);
  const result = { juz: 0, surah: 0, ayah: 0 };

  for (const piece of progressPieces) {
    let availableCount = getAvailablePieceCount(remaining, piece.keys);
    while (availableCount > 0) {
      for (const key of piece.keys) {
        const nextCount = (remaining.get(key) ?? 0) - 1;
        if (nextCount > 0) {
          remaining.set(key, nextCount);
        } else {
          remaining.delete(key);
        }
      }
      result[piece.unit] += 1;
      availableCount -= 1;
    }
  }

  result.ayah = [...remaining.values()].reduce((total, count) => total + count, 0);
  return result;
}

function getAvailablePieceCount(counts: Map<string, number>, keys: string[]) {
  return keys.reduce((available, key) => Math.min(available, counts.get(key) ?? 0), Number.POSITIVE_INFINITY);
}

function buildProgressPieces() {
  const juzKeys = new Map<number, string[]>();
  for (const surah of surahList) {
    for (let ayah = 1; ayah <= surah.ayahs; ayah += 1) {
      const juz = getJuz(surah.name, ayah);
      if (!juz) continue;
      const keys = juzKeys.get(juz) ?? [];
      keys.push(ayahKey(surah.name, ayah));
      juzKeys.set(juz, keys);
    }
  }

  const pieces: Array<{ unit: ProgressUnit; keys: string[] }> = [
    ...[...juzKeys.values()].map((keys) => ({ unit: "juz" as const, keys })),
    ...surahList.map((surah) => ({
      unit: "surah" as const,
      keys: Array.from({ length: surah.ayahs }, (_, index) =>
        ayahKey(surah.name, index + 1),
      ),
    })),
  ];

  return pieces.sort((left, right) => {
    const lengthDifference = right.keys.length - left.keys.length;
    if (lengthDifference !== 0) return lengthDifference;
    if (left.unit === right.unit) return 0;
    return left.unit === "juz" ? -1 : 1;
  });
}

function ayahKey(surah: string, ayah: number) {
  return `${surah}:${ayah}`;
}

const surahAyahCountByName = new Map(
  surahList.map((surah) => [surah.name, surah.ayahs]),
);

const progressPieces = buildProgressPieces();

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
