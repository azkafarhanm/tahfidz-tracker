import { NextResponse } from "next/server";
import { ProgramType, Semester } from "@/generated/prisma-next/enums";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { statusLabels, formatRange } from "@/lib/format";
import { createPdfStreamResponse } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";
import { getTeacherExportBundle } from "@/lib/reports";
import { getRequestSessionScope } from "@/lib/session";
import { semesterLabel } from "@/lib/summative";
import { locales, defaultLocale } from "@/i18n/request";
import type { Locale } from "@/i18n/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportBundle = Awaited<ReturnType<typeof getTeacherExportBundle>>;

function buildProgramSection(
  bundle: ExportBundle,
  programLabel: string,
) {
  const summary = bundle.summary;
  const items: Array<
    | { type: "subtitle"; text: string }
    | { type: "text"; text: string }
    | { type: "cards"; items: Array<{ label: string; value: string | number }> }
    | { type: "table"; headers: string[]; rows: string[][] }
  > = [
    { type: "subtitle", text: `Program ${programLabel}` },
    {
      type: "cards",
      items: [
        { label: "SANTRI", value: summary.studentCount },
        { label: "HAFALAN", value: summary.totalHafalan },
        { label: "MUROJAAH", value: summary.totalMurojaah },
        { label: "SKOR", value: summary.avgScore ?? "-" },
        { label: "PERLU CEK", value: summary.needsReviewCount },
        { label: "TARGET", value: summary.activeTargetCount },
      ],
    },
  ];

  // Students by grade
  for (const grade of [7, 8, 9]) {
    const gradeStudents = summary.students.filter((s) => s.grade === grade);
    if (gradeStudents.length === 0) continue;
    items.push(
      { type: "subtitle", text: `Santri Kelas ${grade}` },
      {
        type: "table",
        headers: ["Nama", "Kelas", "Halaqah", "Hafalan", "Murojaah", "Skor", "Status"],
        rows: gradeStudents.map((student) => [
          student.fullName,
          student.academicClassName,
          student.halaqahName,
          String(student.hafalanCount),
          String(student.murojaahCount),
          String(student.avgScore ?? "-"),
          student.needsReview ? "Perlu Cek" : student.lastStatus,
        ]),
      },
    );
  }

  // Formative recap
  const formativeRows = [
    ...bundle.formative[Semester.GANJIL].recap.map((s) => [
      semesterLabel(Semester.GANJIL), s.fullName, s.academicClassName,
      String(s.totalAssessments), String(s.averageScore ?? "-"), s.latestRange,
    ]),
    ...bundle.formative[Semester.GENAP].recap.map((s) => [
      semesterLabel(Semester.GENAP), s.fullName, s.academicClassName,
      String(s.totalAssessments), String(s.averageScore ?? "-"), s.latestRange,
    ]),
  ];
  if (formativeRows.length > 0) {
    items.push(
      { type: "subtitle", text: "Rekap Formatif" },
      { type: "table", headers: ["Semester", "Nama", "Kelas", "Total", "Rata-rata", "Terakhir"], rows: formativeRows },
    );
  }

  // Formative detail
  const formativeDetailRows = [
    ...bundle.formative[Semester.GANJIL].exportData.rows.map((row) => [
      semesterLabel(Semester.GANJIL), row.studentName, row.academicClassName,
      row.type, formatRange(row.surah, row.fromAyah, row.toAyah), String(row.score ?? "-"),
    ]),
    ...bundle.formative[Semester.GENAP].exportData.rows.map((row) => [
      semesterLabel(Semester.GENAP), row.studentName, row.academicClassName,
      row.type, formatRange(row.surah, row.fromAyah, row.toAyah), String(row.score ?? "-"),
    ]),
  ];
  if (formativeDetailRows.length > 0) {
    items.push(
      { type: "subtitle", text: "Detail Formatif" },
      { type: "table", headers: ["Semester", "Nama", "Kelas", "Jenis", "Materi", "Nilai"], rows: formativeDetailRows },
    );
  }

  // Summative recap
  const summativeRows = [
    ...bundle.summative[Semester.GANJIL].recap.map((s) => [
      semesterLabel(Semester.GANJIL), s.fullName, s.academicClassName,
      String(s.totalAssessments), String(s.averageScore ?? "-"), s.latestAssessment,
    ]),
    ...bundle.summative[Semester.GENAP].recap.map((s) => [
      semesterLabel(Semester.GENAP), s.fullName, s.academicClassName,
      String(s.totalAssessments), String(s.averageScore ?? "-"), s.latestAssessment,
    ]),
  ];
  if (summativeRows.length > 0) {
    items.push(
      { type: "subtitle", text: "Rekap Sumatif" },
      { type: "table", headers: ["Semester", "Nama", "Kelas", "Jumlah", "Rata-rata", "Catatan"], rows: summativeRows },
    );
  }

  // Summative detail
  const summativeDetailRows = [
    ...bundle.summative[Semester.GANJIL].exportData.rows.map((row) => [
      semesterLabel(Semester.GANJIL), row.studentName, row.academicClassName,
      `${row.surahNumber}. ${row.surahName}`, String(row.score), row.notes ?? "-",
    ]),
    ...bundle.summative[Semester.GENAP].exportData.rows.map((row) => [
      semesterLabel(Semester.GENAP), row.studentName, row.academicClassName,
      `${row.surahNumber}. ${row.surahName}`, String(row.score), row.notes ?? "-",
    ]),
  ];
  if (summativeDetailRows.length > 0) {
    items.push(
      { type: "subtitle", text: "Detail Sumatif" },
      { type: "table", headers: ["Semester", "Nama", "Kelas", "Surah", "Nilai", "Catatan"], rows: summativeDetailRows },
    );
  }

  return items;
}

export async function GET(request: Request) {
  try {
    const scope = await getRequestSessionScope();
    if (!scope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = scope.isAdmin;
    const searchParams = new URL(request.url).searchParams;
    const paramTeacherId = searchParams.get("teacherId");
    const paramAcademicYear = searchParams.get("academicYear");
    const programTypeParam = searchParams.get("programType");
    const programType = programTypeParam === "ACADEMIC" || programTypeParam === "BOARDING"
      ? programTypeParam
      : undefined;

    const localeCookie = request.headers.get("cookie")?.match(/(?:^|;\s*)locale=([^;]+)/)?.[1];
    const locale: Locale = locales.includes(localeCookie as Locale) ? (localeCookie as Locale) : defaultLocale;
    const academicYear = paramAcademicYear || await getActiveAcademicYear();

    let teacherId: string;
    if (isAdmin && paramTeacherId) {
      teacherId = paramTeacherId;
    } else if (!isAdmin && scope.teacherId) {
      teacherId = scope.teacherId;
    } else if (isAdmin) {
      const firstStudent = await prisma.student.findFirst({
        where: { classGroup: { academicYear } },
        select: { teacherId: true },
      });
      if (!firstStudent) {
        return NextResponse.json({ error: "No students found for this academic year" }, { status: 404 });
      }
      teacherId = firstStudent.teacherId;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get teacher name
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { fullName: true },
    });
    const teacherName = teacher?.fullName ?? "Guru";

    const date = new Date().toISOString().split("T")[0];

    if (programType) {
      // Single program export
      const bundle = await getTeacherExportBundle(teacherId, locale, academicYear, programType);
      const programLabel = programType === "BOARDING" ? "Boarding" : "Akademik";

      return createPdfStreamResponse(`Laporan Guru - ${teacherName} - TahfidzFlow`, [
        { type: "title", text: "Laporan Guru" },
        { type: "text", text: teacherName },
        { type: "text", text: `${academicYear} · ${programLabel}` },
        ...buildProgramSection(bundle, programLabel),
        {
          type: "text",
          text: `Status formatif mengikuti catatan harian aktif. Label seperti "${statusLabels.PERLU_MUROJAAH}" tetap diambil dari catatan asli agar evaluasi tetap konsisten.`,
        },
      ], `laporan-guru-${teacherName.toLowerCase().replace(/\s+/g, "-")}-${date}.pdf`);
    }

    // ALL programs: fetch both
    const [academicBundle, boardingBundle] = await Promise.all([
      getTeacherExportBundle(teacherId, locale, academicYear, ProgramType.ACADEMIC),
      getTeacherExportBundle(teacherId, locale, academicYear, ProgramType.BOARDING),
    ]);

    const hasAcademic = academicBundle.summary.studentCount > 0;
    const hasBoarding = boardingBundle.summary.studentCount > 0;

    const content: Array<
      | { type: "title"; text: string }
      | { type: "text"; text: string }
      | { type: "subtitle"; text: string }
      | { type: "cards"; items: Array<{ label: string; value: string | number }> }
      | { type: "table"; headers: string[]; rows: string[][] }
    > = [
      { type: "title", text: "Laporan Guru" },
      { type: "text", text: teacherName },
      { type: "text", text: `${academicYear} · Semua Program` },
    ];

    if (hasAcademic) {
      content.push(...buildProgramSection(academicBundle, "Akademik"));
    }

    if (hasBoarding) {
      if (hasAcademic) content.push({ type: "text", text: "" }); // separator
      content.push(...buildProgramSection(boardingBundle, "Boarding"));
    }

    if (!hasAcademic && !hasBoarding) {
      content.push({ type: "text", text: "Tidak ada data untuk tahun ajaran ini." });
    }

    content.push({
      type: "text",
      text: `Status formatif mengikuti catatan harian aktif. Label seperti "${statusLabels.PERLU_MUROJAAH}" tetap diambil dari catatan asli agar evaluasi tetap konsisten.`,
    });

    return createPdfStreamResponse(
      `Laporan Guru - ${teacherName} - TahfidzFlow`,
      content,
      `laporan-guru-${teacherName.toLowerCase().replace(/\s+/g, "-")}-${date}.pdf`,
    );
  } catch (error) {
    console.error("Failed to generate teacher PDF report", error);
    return NextResponse.json(
      { error: "Failed to generate teacher PDF report" },
      { status: 500 },
    );
  }
}
