import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getCurrentAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { createWorkbookStreamResponse, finalizeTableSheet } from "@/lib/excel";
import { getTeacherFormativeExportData } from "@/lib/formative";
import {
  formatRange,
  halaqahLevelLabels,
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

    if (!isSemesterValue(semesterValue)) {
      return NextResponse.json({ error: "Invalid semester" }, { status: 400 });
    }

    const classLevel = Number.parseInt(classLevelValue, 10);
    if (![7, 8, 9].includes(classLevel)) {
      return NextResponse.json({ error: "Invalid class level" }, { status: 400 });
    }

    const semester = parseSemester(semesterValue);
    const academicYear = getCurrentAcademicYear();
    const exportData = await getTeacherFormativeExportData(
      teacherId,
      semester,
      academicYear,
      classLevel,
    );

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

    const infoSheet = workbook.addWorksheet("Info");
    infoSheet.columns = [
      { header: "Keterangan", key: "key", width: 26 },
      { header: "Nilai", key: "value", width: 24 },
    ];
    [
      { key: "Tahun ajaran", value: academicYear },
      { key: "Kelas", value: classLevel },
      { key: "Semester", value: semesterLabel(semester) },
      { key: "Jumlah santri", value: exportData.students.length },
      { key: "Jumlah catatan", value: exportData.rows.length },
    ].forEach((row) => infoSheet.addRow(row));
    finalizeTableSheet(infoSheet);

    const summarySheet = workbook.addWorksheet("Ringkasan");
    summarySheet.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama Santri", key: "studentName", width: 28 },
      { header: "Kelas Akademik", key: "academicClassName", width: 18 },
      { header: "Halaqah", key: "halaqahName", width: 24 },
      { header: "Level", key: "halaqahLevel", width: 12 },
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
        halaqahLevel: halaqahLevelLabels[student.classGroup.level],
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
      `rekap-formatif-${classLevel}-${semesterValue.toLowerCase()}-${date}.xlsx`,
    );
  } catch (error) {
    console.error("Failed to export formative Excel report", error);
    return NextResponse.json(
      { error: "Failed to export formative Excel report" },
      { status: 500 },
    );
  }
}
