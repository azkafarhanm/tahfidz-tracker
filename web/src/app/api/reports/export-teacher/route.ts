import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { ProgramType, Semester } from "@/generated/prisma-next/enums";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { createWorkbookStreamResponse, finalizeTableSheet } from "@/lib/excel";
import {
  buildAcademicFormativeWorkbook,
  buildFormativeTableWorkbook,
} from "@/lib/formative-excel";
import { prisma } from "@/lib/prisma";
import { getTeacherExportBundle } from "@/lib/reports";
import { getRequestSessionScope } from "@/lib/session";
import { buildSummativeWorkbook } from "@/lib/summative-excel";
import { semesterLabel } from "@/lib/summative";
import { locales, defaultLocale } from "@/i18n/request";
import type { Locale } from "@/i18n/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportBundle = Awaited<ReturnType<typeof getTeacherExportBundle>>;
type FormativeExportData = ExportBundle["formative"]["GANJIL"]["exportData"];
type SummativeExportData = ExportBundle["summative"]["GANJIL"]["exportData"];

function addProgramSheets(
  workbook: ExcelJS.Workbook,
  bundle: ExportBundle,
  programLabel: string,
) {
  for (const semester of [Semester.GANJIL, Semester.GENAP]) {
    const exportData = bundle.formative[semester].exportData;
    const sheetNamePrefix = `${programSheetPrefix(programLabel)} Fmt ${semesterLabel(semester)} `;
    if (programLabel === "Akademik") {
      for (const classLevel of getFormativeClassLevels(exportData)) {
        buildAcademicFormativeWorkbook(workbook, {
          academicYear: bundle.academicYear,
          classLevel,
          semester,
          schoolName: resolveSchoolName(),
          exportData: filterFormativeClassLevel(exportData, classLevel),
          sheetNamePrefix,
        });
      }
    } else {
      buildFormativeTableWorkbook(workbook, {
        academicYear: bundle.academicYear,
        semester,
        programLabel,
        exportData,
        sheetNamePrefix,
      });
    }
  }

  for (const semester of [Semester.GANJIL, Semester.GENAP]) {
    const exportData = bundle.summative[semester].exportData;
    for (const classLevel of getSummativeClassLevels(exportData)) {
      buildSummativeWorkbook(workbook, {
        academicYear: bundle.academicYear,
        classLevel,
        semester,
        schoolName: resolveSchoolName(),
        students: exportData.students.filter(
          (student) => student.classLevel === classLevel,
        ),
        rows: exportData.rows.filter((row) => row.classLevel === classLevel),
        targets: [],
        sheetNamePrefix: `${programSheetPrefix(programLabel)} Sum ${semesterLabel(semester)} `,
      });
    }
  }
}

function getFormativeClassLevels(exportData: FormativeExportData) {
  return [
    ...new Set(
      exportData.students
        .map((student) => student.classGroup.grade)
        .filter((classLevel) => [7, 8, 9].includes(classLevel)),
    ),
  ].sort((left, right) => left - right);
}

function filterFormativeClassLevel(
  exportData: FormativeExportData,
  classLevel: number,
): FormativeExportData {
  const students = exportData.students.filter(
    (student) => student.classGroup.grade === classLevel,
  );
  const studentIds = new Set(students.map((student) => student.id));

  return {
    students,
    rows: exportData.rows.filter((row) => studentIds.has(row.studentId)),
  };
}

function getSummativeClassLevels(exportData: SummativeExportData) {
  return [
    ...new Set(
      exportData.students
        .map((student) => student.classLevel)
        .filter((classLevel) => [7, 8, 9].includes(classLevel)),
    ),
  ].sort((left, right) => left - right);
}

function programSheetPrefix(programLabel: string) {
  return programLabel === "Boarding" ? "Brd" : "Akd";
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

      addProgramSheets(workbook, bundle, programLabel);

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
      addProgramSheets(workbook, academicBundle, "Akademik");
    }
    if (hasBoarding) {
      addProgramSheets(workbook, boardingBundle, "Boarding");
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

function resolveSchoolName() {
  return (
    process.env.SCHOOL_NAME?.trim() ||
    process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() ||
    "TahfidzFlow"
  );
}
