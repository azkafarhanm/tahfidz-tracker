import { NextResponse } from "next/server";
import { Semester } from "@/generated/prisma-next/enums";
import { getCurrentAcademicYear } from "@/lib/academic-year";
import { getTeacherFormativeExportData, getTeacherFormativeOverview } from "@/lib/formative";
import { statusLabels, formatRange } from "@/lib/format";
import { createPdfStreamResponse } from "@/lib/pdf";
import { getTeacherReportData } from "@/lib/reports";
import { getRequestSessionScope } from "@/lib/session";
import {
  getTeacherSummativeExportData,
  getTeacherSummativeOverview,
  semesterLabel,
} from "@/lib/summative";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const scope = await getRequestSessionScope();
    if (!scope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = scope.isAdmin;
    const paramTeacherId = new URL(request.url).searchParams.get("teacherId");

    let teacherId: string;
    if (isAdmin && paramTeacherId) {
      teacherId = paramTeacherId;
    } else if (!isAdmin && scope.teacherId) {
      teacherId = scope.teacherId;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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

    const date = new Date().toISOString().split("T")[0];
    return createPdfStreamResponse("Laporan Guru - TahfidzFlow", [
      { type: "title", text: "Laporan Guru" },
      { type: "text", text: `Ringkasan progres guru untuk tahun ajaran ${academicYear}.` },
      { type: "subtitle", text: "Ringkasan" },
      {
        type: "cards",
        items: [
          { label: "SANTRI", value: summary.studentCount },
          { label: "HAFALAN", value: summary.totalHafalan },
          { label: "MUROJAAH", value: summary.totalMurojaah },
          { label: "SKOR", value: summary.avgScore || "-" },
          { label: "PERLU CEK", value: summary.needsReviewCount },
          { label: "TARGET", value: summary.activeTargetCount },
        ],
      },
      { type: "subtitle", text: "Ringkasan Santri" },
      {
        type: "table",
        headers: ["Nama", "Halaqah", "Hafalan", "Murojaah", "Skor", "Status Terakhir"],
        rows: summary.students.map((student) => [
          student.fullName,
          `${student.halaqahName} (${student.halaqahLevel})`,
          String(student.hafalanCount),
          String(student.murojaahCount),
          String(student.avgScore || "-"),
          student.needsReview ? "Perlu Cek" : student.lastStatus,
        ]),
      },
      { type: "subtitle", text: "Rekap Formatif" },
      {
        type: "table",
        headers: ["Semester", "Nama", "Total", "Rata-rata", "Terakhir"],
        rows: [
          ...formativeGanjil.students.map((student) => [
            semesterLabel(Semester.GANJIL),
            student.fullName,
            String(student.totalAssessments),
            String(student.averageScore ?? "-"),
            student.latestRange,
          ]),
          ...formativeGenap.students.map((student) => [
            semesterLabel(Semester.GENAP),
            student.fullName,
            String(student.totalAssessments),
            String(student.averageScore ?? "-"),
            student.latestRange,
          ]),
        ],
      },
      { type: "subtitle", text: "Detail Formatif" },
      {
        type: "table",
        headers: ["Semester", "Nama", "Jenis", "Materi", "Nilai"],
        rows: [
          ...formativeRowsGanjil.rows.map((row) => [
            semesterLabel(Semester.GANJIL),
            row.studentName,
            row.type,
            formatRange(row.surah, row.fromAyah, row.toAyah),
            String(row.score ?? "-"),
          ]),
          ...formativeRowsGenap.rows.map((row) => [
            semesterLabel(Semester.GENAP),
            row.studentName,
            row.type,
            formatRange(row.surah, row.fromAyah, row.toAyah),
            String(row.score ?? "-"),
          ]),
        ],
      },
      { type: "subtitle", text: "Rekap Sumatif" },
      {
        type: "table",
        headers: ["Semester", "Nama", "Jumlah", "Rata-rata", "Catatan"],
        rows: [
          ...summativeGanjil.students.map((student) => [
            semesterLabel(Semester.GANJIL),
            student.fullName,
            String(student.totalAssessments),
            String(student.averageScore ?? "-"),
            student.latestAssessment,
          ]),
          ...summativeGenap.students.map((student) => [
            semesterLabel(Semester.GENAP),
            student.fullName,
            String(student.totalAssessments),
            String(student.averageScore ?? "-"),
            student.latestAssessment,
          ]),
        ],
      },
      { type: "subtitle", text: "Detail Sumatif" },
      {
        type: "table",
        headers: ["Semester", "Nama", "Surah", "Nilai", "Catatan"],
        rows: [
          ...summativeRowsGanjil.rows.map((row) => [
            semesterLabel(Semester.GANJIL),
            row.studentName,
            `${row.surahNumber}. ${row.surahName}`,
            String(row.score),
            row.notes ?? "-",
          ]),
          ...summativeRowsGenap.rows.map((row) => [
            semesterLabel(Semester.GENAP),
            row.studentName,
            `${row.surahNumber}. ${row.surahName}`,
            String(row.score),
            row.notes ?? "-",
          ]),
        ],
      },
      {
        type: "text",
        text: `Status formatif mengikuti catatan harian aktif. Label seperti "${statusLabels.PERLU_MUROJAAH}" tetap diambil dari catatan asli agar evaluasi tetap konsisten.`,
      },
    ], `laporan-guru-${date}.pdf`);
  } catch (error) {
    console.error("Failed to generate teacher PDF report", error);
    return NextResponse.json(
      { error: "Failed to generate teacher PDF report" },
      { status: 500 },
    );
  }
}
