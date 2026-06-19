import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { ProgramType, Semester } from "@/generated/prisma-next/enums";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { createWorkbookStreamResponse, finalizeTableSheet } from "@/lib/excel";
import { statusLabels, formatRange } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getTeacherExportBundle } from "@/lib/reports";
import { getRequestSessionScope } from "@/lib/session";
import { semesterLabel } from "@/lib/summative";
import { locales, defaultLocale } from "@/i18n/request";
import type { Locale } from "@/i18n/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jakartaDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

type ExportBundle = Awaited<ReturnType<typeof getTeacherExportBundle>>;

function addProgramSheets(
  workbook: ExcelJS.Workbook,
  bundle: ExportBundle,
  programLabel: string,
  isBoarding: boolean,
) {
  const summary = bundle.summary;
  const suffix = ` (${programLabel})`;

  // Summary sheet
  const summarySheet = workbook.addWorksheet(`Ringkasan${suffix}`);
  summarySheet.columns = [
    { header: "Metrik", key: "metric", width: 28 },
    { header: "Nilai", key: "value", width: 20 },
  ];
  [
    { metric: "Program", value: programLabel },
    { metric: "Jumlah Santri Aktif", value: summary.studentCount },
    { metric: "Total Hafalan", value: summary.totalHafalan },
    { metric: "Total Murojaah", value: summary.totalMurojaah },
    { metric: "Rata-rata Skor Harian", value: summary.avgScore ?? "-" },
    { metric: "Perlu Cek / Murojaah", value: summary.needsReviewCount },
    { metric: "Target Aktif", value: summary.activeTargetCount },
  ].forEach((row) => summarySheet.addRow(row));
  finalizeTableSheet(summarySheet);

  // Progress sheet
  const progressSheet = workbook.addWorksheet(`Progres${suffix}`);
  progressSheet.columns = [
    { header: "Nama", key: "name", width: 25 },
    { header: "Halaqah", key: "halaqah", width: 20 },
    ...(!isBoarding ? [{ header: "Level", key: "level", width: 10 }] : []),
    { header: "Kelas", key: "className", width: 12 },
    { header: "Hafalan", key: "hafalanCount", width: 10 },
    { header: "Murojaah", key: "murojaahCount", width: 10 },
    { header: "Skor Rata-rata", key: "avgScore", width: 15 },
    { header: "Ayat Terakhir", key: "lastRange", width: 22 },
    { header: "Tanggal Terakhir", key: "lastActivity", width: 18 },
    { header: "Status", key: "lastStatus", width: 16 },
  ];
  summary.students.forEach((student) => {
    progressSheet.addRow({
      name: student.fullName,
      halaqah: student.halaqahName,
      ...(!isBoarding ? { level: student.halaqahLevel } : {}),
      className: student.academicClassName,
      hafalanCount: student.hafalanCount,
      murojaahCount: student.murojaahCount,
      avgScore: student.avgScore ?? "-",
      lastRange: student.lastRange,
      lastActivity: student.lastActivity,
      lastStatus: student.needsReview ? "Perlu Cek" : student.lastStatus,
    });
  });
  finalizeTableSheet(progressSheet, {
    wrapColumns: ["name", "halaqah", "lastRange", "lastStatus"],
    centerColumns: ["hafalanCount", "murojaahCount", "avgScore"],
  });

  // Formative recap
  const formativeRecapSheet = workbook.addWorksheet(`Rekap Formatif${suffix}`);
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
  for (const [label, overview] of [
    [semesterLabel(Semester.GANJIL), bundle.formative[Semester.GANJIL].recap],
    [semesterLabel(Semester.GENAP), bundle.formative[Semester.GENAP].recap],
  ] as const) {
    overview.forEach((student) => {
      formativeRecapSheet.addRow({
        semester: label,
        studentName: student.fullName,
        halaqah: student.halaqahName,
        className: student.academicClassName,
        hafalanCount: student.hafalanCount,
        murojaahCount: student.murojaahCount,
        total: student.totalAssessments,
        average: student.averageScore ?? "-",
      });
    });
  }
  finalizeTableSheet(formativeRecapSheet, {
    wrapColumns: ["studentName", "halaqah"],
    centerColumns: ["semester", "hafalanCount", "murojaahCount", "total", "average"],
  });

  // Formative detail
  const formativeDetailSheet = workbook.addWorksheet(`Detail Formatif${suffix}`);
  formativeDetailSheet.columns = [
    { header: "Semester", key: "semester", width: 12 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Kelas", key: "className", width: 16 },
    { header: "Jenis", key: "type", width: 12 },
    { header: "Materi", key: "range", width: 30 },
    { header: "Nilai", key: "score", width: 10 },
    { header: "Status", key: "status", width: 18 },
    { header: "Tanggal", key: "date", width: 16 },
    { header: "Catatan", key: "notes", width: 30 },
  ];
  for (const [label, detail] of [
    [semesterLabel(Semester.GANJIL), bundle.formative[Semester.GANJIL].exportData],
    [semesterLabel(Semester.GENAP), bundle.formative[Semester.GENAP].exportData],
  ] as const) {
    detail.rows.forEach((row) => {
      formativeDetailSheet.addRow({
        semester: label,
        studentName: row.studentName,
        className: row.academicClassName,
        type: row.type,
        range: formatRange(row.surah, row.fromAyah, row.toAyah),
        score: row.score ?? "",
        status: statusLabels[row.status],
        date: jakartaDateFormatter.format(row.date),
        notes: row.notes ?? "",
      });
    });
  }
  finalizeTableSheet(formativeDetailSheet, {
    wrapColumns: ["studentName", "range", "status", "notes"],
    centerColumns: ["semester", "score"],
  });

  // Summative recap
  const summativeRecapSheet = workbook.addWorksheet(`Rekap Sumatif${suffix}`);
  summativeRecapSheet.columns = [
    { header: "Semester", key: "semester", width: 12 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Halaqah", key: "halaqah", width: 24 },
    { header: "Kelas", key: "className", width: 16 },
    { header: "Total Penilaian", key: "total", width: 16 },
    { header: "Rata-rata", key: "average", width: 12 },
  ];
  for (const [label, overview] of [
    [semesterLabel(Semester.GANJIL), bundle.summative[Semester.GANJIL].recap],
    [semesterLabel(Semester.GENAP), bundle.summative[Semester.GENAP].recap],
  ] as const) {
    overview.forEach((student) => {
      summativeRecapSheet.addRow({
        semester: label,
        studentName: student.fullName,
        halaqah: student.halaqahName,
        className: student.academicClassName,
        total: student.totalAssessments,
        average: student.averageScore ?? "-",
      });
    });
  }
  finalizeTableSheet(summativeRecapSheet, {
    wrapColumns: ["studentName", "halaqah"],
    centerColumns: ["semester", "total", "average"],
  });

  // Summative detail
  const summativeDetailSheet = workbook.addWorksheet(`Detail Sumatif${suffix}`);
  summativeDetailSheet.columns = [
    { header: "Semester", key: "semester", width: 12 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Kelas", key: "className", width: 16 },
    { header: "Surah", key: "surah", width: 24 },
    { header: "Arab", key: "arabic", width: 20 },
    { header: "Nilai", key: "score", width: 10 },
    { header: "Catatan", key: "notes", width: 30 },
    { header: "Tanggal", key: "createdAt", width: 16 },
  ];
  for (const [label, detail] of [
    [semesterLabel(Semester.GANJIL), bundle.summative[Semester.GANJIL].exportData],
    [semesterLabel(Semester.GENAP), bundle.summative[Semester.GENAP].exportData],
  ] as const) {
    detail.rows.forEach((row) => {
      summativeDetailSheet.addRow({
        semester: label,
        studentName: row.studentName,
        className: row.academicClassName,
        surah: `${row.surahNumber}. ${row.surahName}`,
        arabic: row.surahArabicName,
        score: row.score,
        notes: row.notes ?? "",
        createdAt: jakartaDateFormatter.format(row.createdAt),
      });
    });
  }
  finalizeTableSheet(summativeDetailSheet, {
    wrapColumns: ["studentName", "surah", "arabic", "notes"],
    centerColumns: ["semester", "score"],
  });
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

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TahfidzFlow";
    workbook.created = new Date();

    const date = new Date().toISOString().split("T")[0];

    if (programType) {
      // Single program export
      const bundle = await getTeacherExportBundle(teacherId, locale, academicYear, programType);
      const isBoarding = programType === "BOARDING";
      const programLabel = isBoarding ? "Boarding" : "Akademik";

      // Info sheet
      const infoSheet = workbook.addWorksheet("Info");
      infoSheet.columns = [
        { header: "Metrik", key: "metric", width: 28 },
        { header: "Nilai", key: "value", width: 24 },
      ];
      [
        { metric: "Laporan", value: "Laporan Guru" },
        { metric: "Guru", value: teacherName },
        { metric: "Tahun Ajaran", value: academicYear },
        { metric: "Program", value: programLabel },
      ].forEach((row) => infoSheet.addRow(row));
      finalizeTableSheet(infoSheet);

      addProgramSheets(workbook, bundle, programLabel, isBoarding);

      return createWorkbookStreamResponse(
        workbook,
        `laporan-guru-${teacherName.toLowerCase().replace(/\s+/g, "-")}-${date}.xlsx`,
      );
    }

    // ALL programs: fetch both
    const [academicBundle, boardingBundle] = await Promise.all([
      getTeacherExportBundle(teacherId, locale, academicYear, ProgramType.ACADEMIC),
      getTeacherExportBundle(teacherId, locale, academicYear, ProgramType.BOARDING),
    ]);

    const hasAcademic = academicBundle.summary.studentCount > 0;
    const hasBoarding = boardingBundle.summary.studentCount > 0;

    // Info sheet
    const infoSheet = workbook.addWorksheet("Info");
    infoSheet.columns = [
      { header: "Metrik", key: "metric", width: 28 },
      { header: "Nilai", key: "value", width: 24 },
    ];
    [
      { metric: "Laporan", value: "Laporan Guru" },
      { metric: "Guru", value: teacherName },
      { metric: "Tahun Ajaran", value: academicYear },
      { metric: "Program", value: "Semua" },
      { metric: "Santri Akademik", value: academicBundle.summary.studentCount },
      { metric: "Santri Boarding", value: boardingBundle.summary.studentCount },
    ].forEach((row) => infoSheet.addRow(row));
    finalizeTableSheet(infoSheet);

    if (hasAcademic) {
      addProgramSheets(workbook, academicBundle, "Akademik", false);
    }
    if (hasBoarding) {
      addProgramSheets(workbook, boardingBundle, "Boarding", true);
    }

    if (!hasAcademic && !hasBoarding) {
      const emptySheet = workbook.addWorksheet("Data");
      emptySheet.columns = [{ header: "Info", key: "info", width: 40 }];
      emptySheet.addRow({ info: "Tidak ada data untuk tahun ajaran ini." });
      finalizeTableSheet(emptySheet);
    }

    return createWorkbookStreamResponse(
      workbook,
      `laporan-guru-${teacherName.toLowerCase().replace(/\s+/g, "-")}-${date}.xlsx`,
    );
  } catch (error) {
    console.error("Failed to export teacher Excel report", error);
    return NextResponse.json(
      { error: "Failed to export teacher Excel report" },
      { status: 500 },
    );
  }
}
