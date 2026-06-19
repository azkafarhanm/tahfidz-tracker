import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { createWorkbookStreamResponse, finalizeTableSheet } from "@/lib/excel";
import {
  getTeacherSummativeExportData,
  isSemesterValue,
  parseSemester,
  semesterLabel,
} from "@/lib/summative";
import { getRequestSessionScope } from "@/lib/session";

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
    const exportData = await getTeacherSummativeExportData(
      teacherId,
      semester,
      academicYear,
      classLevel,
      programType,
    );

    const isBoarding = programType === "BOARDING";
    const programLabel = isBoarding ? "Boarding" : "Akademik";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TahfidzFlow";
    workbook.created = new Date();

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
      { key: "Jumlah penilaian", value: exportData.rows.length },
    ].forEach((row) => infoSheet.addRow(row));
    finalizeTableSheet(infoSheet);

    const summarySheet = workbook.addWorksheet("Ringkasan");
    summarySheet.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama Santri", key: "studentName", width: 28 },
      { header: isBoarding ? "Kelas Boarding" : "Kelas Akademik", key: "academicClassName", width: 18 },
      { header: "Halaqah", key: "halaqahName", width: 26 },
      { header: "Total Penilaian", key: "totalAssessments", width: 18 },
      { header: "Surah Terakhir", key: "latestSurah", width: 22 },
      { header: "Nilai Terakhir", key: "latestScore", width: 14 },
      { header: "Rata-rata Santri", key: "averageScore", width: 16 },
    ];
    const latestRowByStudent = new Map<string, (typeof exportData.rows)[number]>();
    for (const row of exportData.rows) {
      if (!latestRowByStudent.has(row.studentId)) {
        latestRowByStudent.set(row.studentId, row);
      }
    }

    exportData.students.forEach((student, index) => {
      const latestRow = latestRowByStudent.get(student.id);
      summarySheet.addRow({
        no: index + 1,
        studentName: student.fullName,
        academicClassName: student.academicClassName,
        halaqahName: student.halaqahName,
        totalAssessments: student.totalAssessments,
        latestSurah: latestRow ? `${latestRow.surahNumber}. ${latestRow.surahName}` : "-",
        latestScore: latestRow?.score ?? "-",
        averageScore: student.averageScore ?? "-",
      });
    });
    finalizeTableSheet(summarySheet, {
      wrapColumns: ["studentName", "halaqahName", "latestSurah"],
      centerColumns: [
        "no",
        "totalAssessments",
        "latestScore",
        "averageScore",
      ],
    });

    const detailSheet = workbook.addWorksheet("Detail Sumatif");
    detailSheet.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama Santri", key: "studentName", width: 28 },
      { header: isBoarding ? "Kelas Boarding" : "Kelas Akademik", key: "academicClassName", width: 18 },
      { header: "Halaqah", key: "halaqahName", width: 26 },
      { header: "Semester", key: "semester", width: 12 },
      { header: "No Surah", key: "surahNumber", width: 10 },
      { header: "Nama Surah", key: "surahName", width: 22 },
      { header: "Arab", key: "surahArabicName", width: 20 },
      { header: "Nilai", key: "score", width: 10 },
      { header: "Catatan", key: "notes", width: 30 },
      { header: "Tanggal", key: "createdAt", width: 16 },
    ];
    exportData.rows.forEach((row, index) => {
      detailSheet.addRow({
        no: index + 1,
        studentName: row.studentName,
        academicClassName: row.academicClassName,
        halaqahName: row.halaqahName,
        semester: semesterLabel(row.semester),
        surahNumber: row.surahNumber,
        surahName: row.surahName,
        surahArabicName: row.surahArabicName,
        score: row.score,
        notes: row.notes ?? "",
        createdAt: jakartaDateFormatter.format(row.createdAt),
      });
    });
    finalizeTableSheet(detailSheet, {
      wrapColumns: ["studentName", "halaqahName", "surahName", "surahArabicName", "notes"],
      centerColumns: ["no", "semester", "surahNumber", "score"],
    });

    const date = new Date().toISOString().split("T")[0];
    return createWorkbookStreamResponse(
      workbook,
      `nilai-sumatif-${programLabel.toLowerCase()}-${classLevel}-${semesterValue.toLowerCase()}-${date}.xlsx`,
    );
  } catch (error) {
    console.error("Failed to export summative Excel report", error);
    return NextResponse.json(
      { error: "Failed to export summative Excel report" },
      { status: 500 },
    );
  }
}
