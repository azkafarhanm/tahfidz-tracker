import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { createWorkbookStreamResponse, finalizeTableSheet } from "@/lib/excel";
import { getTeacherFormativeExportData } from "@/lib/formative";
import { buildFormativeWorkbook } from "@/lib/summative-excel";
import {
  formatRange,
  statusLabels,
} from "@/lib/format";
import { getRequestSessionScope } from "@/lib/session";
import { isSemesterValue, parseSemester, semesterLabel } from "@/lib/summative";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

type FormativeExportRow = Awaited<
  ReturnType<typeof getTeacherFormativeExportData>
>["rows"][number];
type ScoredFormativeExportRow = FormativeExportRow & { score: number };

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

export async function GET(request: Request) {
  try {
    const scope = await getRequestSessionScope();
    if (!scope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = scope.isAdmin ? null : scope.teacherId;
    if (!scope.isAdmin && !teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const semesterValue = searchParams.get("semester") ?? getSemesterForDate(new Date());
    const classLevelValue = searchParams.get("classLevel") ?? "7";
    const programTypeParam = searchParams.get("programType");
    const programType = programTypeParam === "ACADEMIC" || programTypeParam === "BOARDING"
      ? programTypeParam
      : undefined;

    if (!isSemesterValue(semesterValue)) {
      return NextResponse.json({ error: "Invalid semester" }, { status: 400 });
    }

    const classLevel = Number.parseInt(classLevelValue, 10);
    if (![7, 8, 9].includes(classLevel)) {
      return NextResponse.json({ error: "Invalid class level" }, { status: 400 });
    }

    const semester = parseSemester(semesterValue);
    const academicYear = await getActiveAcademicYear();
    const exportData = await getTeacherFormativeExportData(
      teacherId,
      semester,
      academicYear,
      classLevel,
      programType,
    );

    const isBoarding = programType === "BOARDING";
    const programLabel = isBoarding ? "Boarding" : "Akademik";

    const studentsById = new Map(
      exportData.students.map((student) => [student.id, student]),
    );
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

    for (const row of exportData.rows) {
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
        if (!current.latestScoreDate || row.date.getTime() > current.latestScoreDate.getTime()) {
          current.latestScore = row.score;
          current.latestScoreDate = row.date;
        }
      }

      studentSummary.set(row.studentId, current);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TahfidzFlow";
    workbook.created = new Date();

    if (!isBoarding) {
      const { meetingCount, scoresByStudent } = buildMeetingScores(
        exportData.rows,
      );
      buildFormativeWorkbook(workbook, {
        academicYear,
        classLevel,
        semester,
        schoolName: resolveSchoolName(),
        students: exportData.students.map((student) => {
          const summary = studentSummary.get(student.id);
          return {
            id: student.id,
            fullName: student.fullName,
            academicClassName: student.academicClass?.name ?? "-",
            averageScore:
              summary && summary.scoredCount > 0
                ? Math.round(
                    (summary.totalScore / summary.scoredCount) * 10,
                  ) / 10
                : null,
          };
        }),
        rows: exportData.rows,
        scoresByStudent,
        meetingCount,
      });

      const date = new Date().toISOString().split("T")[0];
      return createWorkbookStreamResponse(
        workbook,
        `rekap-formatif-akademik-${classLevel}-${semesterValue.toLowerCase()}-${date}.xlsx`,
      );
    }

    const infoSheet = workbook.addWorksheet("Info");
    infoSheet.columns = [
      { header: "Keterangan", key: "key", width: 26 },
      { header: "Nilai", key: "value", width: 24 },
    ];
    [
      { key: "Program", value: programLabel },
      { key: "Tahun ajaran", value: academicYear },
      { key: "Kelas", value: classLevel },
      { key: "Semester", value: semesterLabel(semester) },
      { key: "Jumlah santri", value: exportData.students.length },
      { key: "Jumlah catatan", value: exportData.rows.length },
    ].forEach((row) => infoSheet.addRow(row));
    finalizeTableSheet(infoSheet);

    const summarySheet = workbook.addWorksheet("Ringkasan");
    const summaryColumns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama Santri", key: "studentName", width: 28 },
      { header: isBoarding ? "Kelas Boarding" : "Kelas Akademik", key: "academicClassName", width: 18 },
      { header: "Halaqah", key: "halaqahName", width: 24 },
      { header: "Hafalan", key: "hafalanCount", width: 12 },
      { header: "Murojaah", key: "murojaahCount", width: 12 },
      { header: "Total Catatan", key: "totalCount", width: 14 },
      { header: "Skor Tercatat", key: "scoredCount", width: 14 },
      { header: "Nilai Terakhir", key: "latestScore", width: 14 },
      { header: "Rata-rata Santri", key: "averageScore", width: 16 },
    ];
    summarySheet.columns = summaryColumns;

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

    const dailyScoreSheet = workbook.addWorksheet("Skor Harian");
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
      .filter((row): row is (typeof exportData.rows)[number] & { score: number } => row.score !== null)
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

    const detailSheet = workbook.addWorksheet("Detail Formatif");
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

    const date = new Date().toISOString().split("T")[0];
    return createWorkbookStreamResponse(
      workbook,
      `rekap-formatif-${programLabel.toLowerCase()}-${classLevel}-${semesterValue.toLowerCase()}-${date}.xlsx`,
    );
  } catch (error) {
    console.error("Failed to export formative Excel report", error);
    return NextResponse.json(
      { error: "Failed to export formative Excel report" },
      { status: 500 },
    );
  }
}

function resolveSchoolName() {
  return (
    process.env.SCHOOL_NAME?.trim() ||
    process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() ||
    "TahfidzFlow"
  );
}
