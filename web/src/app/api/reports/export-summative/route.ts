import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCurrentAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import {
  getTeacherSummativeExportData,
  isSemesterValue,
  parseSemester,
  semesterLabel,
} from "@/lib/summative";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role === "ADMIN" || !session.user.teacherId) {
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
  const exportData = await getTeacherSummativeExportData(
    session.user.teacherId,
    semester,
    academicYear,
    classLevel,
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TahfidzFlow";
  workbook.created = new Date();

  const headerFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF064E3B" },
  };
  const headerFont = {
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  const infoSheet = workbook.addWorksheet("Info");
  infoSheet.columns = [
    { header: "Keterangan", key: "key", width: 26 },
    { header: "Nilai", key: "value", width: 24 },
  ];
  infoSheet.getRow(1).fill = headerFill;
  infoSheet.getRow(1).font = headerFont;
  [
    { key: "Tahun ajaran", value: academicYear },
    { key: "Kelas", value: classLevel },
    { key: "Semester", value: semesterLabel(semester) },
    { key: "Jumlah santri", value: exportData.students.length },
    { key: "Jumlah penilaian", value: exportData.rows.length },
    { key: "Surah acuan kelas", value: exportData.recommendedTargetCount },
  ].forEach((row) => infoSheet.addRow(row));

  const summarySheet = workbook.addWorksheet("Ringkasan");
  summarySheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Kelas Akademik", key: "academicClassName", width: 18 },
    { header: "Halaqah", key: "halaqahName", width: 26 },
    { header: "Total Penilaian", key: "totalAssessments", width: 18 },
    { header: "Surah Terakhir", key: "latestSurah", width: 22 },
    { header: "Nilai Terakhir", key: "latestScore", width: 14 },
    { header: "Rata-rata Santri", key: "averageScore", width: 16 },
  ];
  summarySheet.getRow(1).fill = headerFill;
  summarySheet.getRow(1).font = headerFont;

  exportData.students.forEach((student, index) => {
    const latestRow = exportData.rows.find((row) => row.studentId === student.id);
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

  const detailSheet = workbook.addWorksheet("Detail Sumatif");
  detailSheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Kelas Akademik", key: "academicClassName", width: 18 },
    { header: "Halaqah", key: "halaqahName", width: 26 },
    { header: "Semester", key: "semester", width: 12 },
    { header: "No Surah", key: "surahNumber", width: 10 },
    { header: "Nama Surah", key: "surahName", width: 22 },
    { header: "Arab", key: "surahArabicName", width: 20 },
    { header: "Nilai", key: "score", width: 10 },
    { header: "Catatan", key: "notes", width: 30 },
    { header: "Tanggal", key: "createdAt", width: 16 },
  ];
  detailSheet.getRow(1).fill = headerFill;
  detailSheet.getRow(1).font = headerFont;

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
      createdAt: row.createdAt.toLocaleDateString("id-ID"),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="nilai-sumatif-${classLevel}-${semesterValue.toLowerCase()}-${date}.xlsx"`,
    },
  });
}
