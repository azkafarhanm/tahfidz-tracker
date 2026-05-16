import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Semester } from "@/generated/prisma-next/enums";
import { getCurrentAcademicYear } from "@/lib/academic-year";
import { getTeacherFormativeExportData, getTeacherFormativeOverview } from "@/lib/formative";
import { statusLabels, formatRange } from "@/lib/format";
import { getTeacherReportData } from "@/lib/reports";
import {
  getTeacherSummativeExportData,
  getTeacherSummativeOverview,
  semesterLabel,
} from "@/lib/summative";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
    if (!session?.user || session.user.role === "ADMIN" || !session.user.teacherId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teacherId = session.user.teacherId;
  const locale = "id";
  const academicYear = getCurrentAcademicYear();

  const [
    summary,
    formativeGanjil,
    formativeGenap,
    formativeRowsGanjil,
    formativeRowsGenap,
    summativeGanjil,
    summativeGenap,
    summativeRowsGanjil,
    summativeRowsGenap,
  ] = await Promise.all([
    getTeacherReportData(teacherId, locale),
    getTeacherFormativeOverview(teacherId, Semester.GANJIL, academicYear, undefined, locale),
    getTeacherFormativeOverview(teacherId, Semester.GENAP, academicYear, undefined, locale),
    getTeacherFormativeExportData(teacherId, Semester.GANJIL, academicYear),
    getTeacherFormativeExportData(teacherId, Semester.GENAP, academicYear),
    getTeacherSummativeOverview(teacherId, Semester.GANJIL, academicYear, undefined, locale),
    getTeacherSummativeOverview(teacherId, Semester.GENAP, academicYear, undefined, locale),
    getTeacherSummativeExportData(teacherId, Semester.GANJIL, academicYear),
    getTeacherSummativeExportData(teacherId, Semester.GENAP, academicYear),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TahfidzFlow";
  workbook.created = new Date();

  const headerFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF064E3B" },
  };
  const headerFont = { bold: true, color: { argb: "FFFFFFFF" } };

  const summarySheet = workbook.addWorksheet("Ringkasan");
  summarySheet.columns = [
    { header: "Metrik", key: "metric", width: 28 },
    { header: "Nilai", key: "value", width: 20 },
  ];
  summarySheet.getRow(1).fill = headerFill;
  summarySheet.getRow(1).font = headerFont;

  [
    { metric: "Tahun Ajaran", value: academicYear },
    { metric: "Jumlah Santri Aktif", value: summary.studentCount },
    { metric: "Total Hafalan", value: summary.totalHafalan },
    { metric: "Total Murojaah", value: summary.totalMurojaah },
    { metric: "Rata-rata Skor Harian", value: summary.avgScore || "-" },
    { metric: "Perlu Cek / Murojaah", value: summary.needsReviewCount },
    { metric: "Target Aktif", value: summary.activeTargetCount },
  ].forEach((row) => summarySheet.addRow(row));

  const progressSheet = workbook.addWorksheet("Progres Santri");
  progressSheet.columns = [
    { header: "Nama", key: "name", width: 25 },
    { header: "Halaqah", key: "halaqah", width: 20 },
    { header: "Level", key: "level", width: 10 },
    { header: "Kelas", key: "className", width: 12 },
    { header: "Hafalan", key: "hafalanCount", width: 10 },
    { header: "Murojaah", key: "murojaahCount", width: 10 },
    { header: "Skor Rata-rata", key: "avgScore", width: 15 },
    { header: "Ayat Terakhir", key: "lastRange", width: 22 },
    { header: "Tanggal Terakhir", key: "lastActivity", width: 18 },
    { header: "Status", key: "lastStatus", width: 16 },
  ];
  progressSheet.getRow(1).fill = headerFill;
  progressSheet.getRow(1).font = headerFont;
  summary.students.forEach((student) => {
    progressSheet.addRow({
      name: student.fullName,
      halaqah: student.halaqahName,
      level: student.halaqahLevel,
      className: student.academicClassName,
      hafalanCount: student.hafalanCount,
      murojaahCount: student.murojaahCount,
      avgScore: student.avgScore || "-",
      lastRange: student.lastRange,
      lastActivity: student.lastActivity,
      lastStatus: student.needsReview ? "Perlu Cek" : student.lastStatus,
    });
  });

  const formativeRecapSheet = workbook.addWorksheet("Rekap Formatif");
  formativeRecapSheet.columns = [
    { header: "Semester", key: "semester", width: 12 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Halaqah", key: "halaqah", width: 24 },
    { header: "Kelas", key: "className", width: 16 },
    { header: "Hafalan", key: "hafalanCount", width: 12 },
    { header: "Murojaah", key: "murojaahCount", width: 12 },
    { header: "Total", key: "total", width: 10 },
    { header: "Rata-rata", key: "average", width: 12 },
  ];
  formativeRecapSheet.getRow(1).fill = headerFill;
  formativeRecapSheet.getRow(1).font = headerFont;

  for (const [label, overview] of [
    [semesterLabel(Semester.GANJIL), formativeGanjil],
    [semesterLabel(Semester.GENAP), formativeGenap],
  ] as const) {
    overview.students.forEach((student) => {
      formativeRecapSheet.addRow({
        semester: label,
        studentName: student.fullName,
        halaqah: `${student.halaqahName} (${student.halaqahLevel})`,
        className: student.academicClassName,
        hafalanCount: student.hafalanCount,
        murojaahCount: student.murojaahCount,
        total: student.totalAssessments,
        average: student.averageScore ?? "-",
      });
    });
  }

  const formativeDetailSheet = workbook.addWorksheet("Detail Formatif");
  formativeDetailSheet.columns = [
    { header: "Semester", key: "semester", width: 12 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Jenis", key: "type", width: 12 },
    { header: "Materi", key: "range", width: 30 },
    { header: "Nilai", key: "score", width: 10 },
    { header: "Status", key: "status", width: 18 },
    { header: "Tanggal", key: "date", width: 16 },
    { header: "Catatan", key: "notes", width: 30 },
  ];
  formativeDetailSheet.getRow(1).fill = headerFill;
  formativeDetailSheet.getRow(1).font = headerFont;

  for (const [label, detail] of [
    [semesterLabel(Semester.GANJIL), formativeRowsGanjil],
    [semesterLabel(Semester.GENAP), formativeRowsGenap],
  ] as const) {
    detail.rows.forEach((row) => {
      formativeDetailSheet.addRow({
        semester: label,
        studentName: row.studentName,
        type: row.type,
        range: formatRange(row.surah, row.fromAyah, row.toAyah),
        score: row.score ?? "",
        status: statusLabels[row.status],
        date: row.date.toLocaleDateString("id-ID"),
        notes: row.notes ?? "",
      });
    });
  }

  const summativeRecapSheet = workbook.addWorksheet("Rekap Sumatif");
  summativeRecapSheet.columns = [
    { header: "Semester", key: "semester", width: 12 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Halaqah", key: "halaqah", width: 24 },
    { header: "Kelas", key: "className", width: 16 },
    { header: "Total Penilaian", key: "total", width: 16 },
    { header: "Rata-rata", key: "average", width: 12 },
  ];
  summativeRecapSheet.getRow(1).fill = headerFill;
  summativeRecapSheet.getRow(1).font = headerFont;

  for (const [label, overview] of [
    [semesterLabel(Semester.GANJIL), summativeGanjil],
    [semesterLabel(Semester.GENAP), summativeGenap],
  ] as const) {
    overview.students.forEach((student) => {
      summativeRecapSheet.addRow({
        semester: label,
        studentName: student.fullName,
        halaqah: `${student.halaqahName} (${student.halaqahLevel})`,
        className: student.academicClassName,
        total: student.totalAssessments,
        average: student.averageScore ?? "-",
      });
    });
  }

  const summativeDetailSheet = workbook.addWorksheet("Detail Sumatif");
  summativeDetailSheet.columns = [
    { header: "Semester", key: "semester", width: 12 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Surah", key: "surah", width: 24 },
    { header: "Arab", key: "arabic", width: 20 },
    { header: "Nilai", key: "score", width: 10 },
    { header: "Catatan", key: "notes", width: 30 },
    { header: "Tanggal", key: "createdAt", width: 16 },
  ];
  summativeDetailSheet.getRow(1).fill = headerFill;
  summativeDetailSheet.getRow(1).font = headerFont;

  for (const [label, detail] of [
    [semesterLabel(Semester.GANJIL), summativeRowsGanjil],
    [semesterLabel(Semester.GENAP), summativeRowsGenap],
  ] as const) {
    detail.rows.forEach((row) => {
      summativeDetailSheet.addRow({
        semester: label,
        studentName: row.studentName,
        surah: `${row.surahNumber}. ${row.surahName}`,
        arabic: row.surahArabicName,
        score: row.score,
        notes: row.notes ?? "",
        createdAt: row.createdAt.toLocaleDateString("id-ID"),
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laporan-guru-${date}.xlsx"`,
    },
  });
}
