import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { createWorkbookStreamResponse } from "@/lib/excel";
import { getRequestSessionScope } from "@/lib/session";
import { isSemesterValue, parseSemester } from "@/lib/summative";
import { buildTahsinWorkbook } from "@/lib/tahsin-excel";
import { getTahsinExportData } from "@/lib/tahsin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const scope = await getRequestSessionScope();
    if (!scope || (!scope.isAdmin && !scope.teacherId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const semesterValue = searchParams.get("semester") ?? getSemesterForDate(new Date());
    const classLevelValue = searchParams.get("classLevel") ?? "7";
    const programType = searchParams.get("programType");

    if (!isSemesterValue(semesterValue)) {
      return NextResponse.json({ error: "Invalid semester" }, { status: 400 });
    }

    if (programType && programType !== "ACADEMIC") {
      return NextResponse.json({ error: "Tahsin export is Academic only" }, { status: 400 });
    }

    const classLevel = Number.parseInt(classLevelValue, 10);
    if (classLevel !== 7) {
      return NextResponse.json({ error: "Tahsin export is available for grade 7 only" }, { status: 400 });
    }

    const semester = parseSemester(semesterValue);
    const academicYear = await getActiveAcademicYear();
    const exportData = await getTahsinExportData(
      { isAdmin: scope.isAdmin, teacherId: scope.teacherId },
      { academicYear, semester, classLevel },
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TahfidzFlow";
    workbook.created = new Date();
    buildTahsinWorkbook(workbook, {
      academicYear,
      classLevel,
      semester,
      schoolName: resolveSchoolName(),
      exportData,
    });

    const date = new Date().toISOString().split("T")[0];
    return createWorkbookStreamResponse(
      workbook,
      `penilaian-tahsin-akademik-7-${semesterValue.toLowerCase()}-${date}.xlsx`,
    );
  } catch (error) {
    console.error("Failed to export Tahsin Excel report", error);
    return NextResponse.json(
      { error: "Failed to export Tahsin Excel report" },
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
