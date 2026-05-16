import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Semester } from "@/generated/prisma-next/enums";
import { getCurrentAcademicYear } from "@/lib/academic-year";
import { getTeacherFormativeExportData, getTeacherFormativeOverview } from "@/lib/formative";
import { statusLabels, formatRange } from "@/lib/format";
import { generatePdf } from "@/lib/pdf";
import { getTeacherReportData } from "@/lib/reports";
import {
  getTeacherSummativeExportData,
  getTeacherSummativeOverview,
  semesterLabel,
} from "@/lib/summative";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
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

    const pdfBuffer = await generatePdf("Laporan Guru - TahfidzFlow", [
      { type: "title", text: "Laporan Guru" },
      { type: "text", text: `Tahun ajaran ${academicYear}` },
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
      { type: "subtitle", text: "Progres Santri" },
      {
        type: "table",
        headers: ["Nama", "Halaqah", "Hafalan", "Murojaah", "Skor", "Status"],
        rows: summary.students.map((student) => [
          student.fullName,
          student.halaqahName,
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
        text: `Status formatif mengikuti catatan harian aktif. Label seperti "${statusLabels.PERLU_MUROJAAH}" tetap dipertahankan dari sumber catatan.`,
      },
    ]);

    const date = new Date().toISOString().split("T")[0];
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="laporan-guru-${date}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate teacher PDF report", error);
    return NextResponse.json(
      { error: "Failed to generate teacher PDF report" },
      { status: 500 },
    );
  }
}
