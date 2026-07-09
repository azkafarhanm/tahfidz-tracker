import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { createWorkbookStreamResponse } from "@/lib/excel";
import { buildSummativeWorkbook } from "@/lib/summative-excel";
import {
  getClassTargets,
  getTeacherSummativeExportData,
  isSemesterValue,
  parseSemester,
} from "@/lib/summative";
import { getRequestSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const [exportData, targets] = await Promise.all([
      getTeacherSummativeExportData(
        teacherId,
        semester,
        academicYear,
        classLevel,
        programType,
      ),
      getClassTargets(classLevel, semester, academicYear),
    ]);

    const isBoarding = programType === "BOARDING";
    const programLabel = isBoarding ? "Boarding" : "Akademik";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TahfidzFlow";
    workbook.created = new Date();

    buildSummativeWorkbook(workbook, {
      academicYear,
      classLevel,
      semester,
      schoolName: resolveSchoolName(),
      students: exportData.students,
      rows: exportData.rows,
      targets,
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

function resolveSchoolName() {
  return (
    process.env.SCHOOL_NAME?.trim() ||
    process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() ||
    "TahfidzFlow"
  );
}
