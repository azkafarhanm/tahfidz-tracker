import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { createWorkbookStreamResponse } from "@/lib/excel";
import {
  buildAcademicFormativeWorkbook,
  buildBoardingFormativeProgressWorkbook,
} from "@/lib/formative-excel";
import { getTeacherFormativeExportData } from "@/lib/formative";
import { getRequestSessionScope } from "@/lib/session";
import { isSemesterValue, parseSemester } from "@/lib/summative";

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
    const isBoarding = programType === "BOARDING";
    const programLabel = isBoarding ? "Boarding" : "Akademik";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TahfidzFlow";
    workbook.created = new Date();

    if (!isBoarding) {
      const exportData = await getTeacherFormativeExportData(
        teacherId,
        semester,
        academicYear,
        classLevel,
        programType,
      );

      buildAcademicFormativeWorkbook(workbook, {
        academicYear,
        classLevel,
        semester,
        schoolName: resolveSchoolName(),
        exportData,
      });

      const date = new Date().toISOString().split("T")[0];
      return createWorkbookStreamResponse(
        workbook,
        `rekap-formatif-akademik-${classLevel}-${semesterValue.toLowerCase()}-${date}.xlsx`,
      );
    }

    const exportData = await getTeacherFormativeExportData(
      teacherId,
      semester,
      academicYear,
      undefined,
      "BOARDING",
    );

    buildBoardingFormativeProgressWorkbook(workbook, { exportData });

    const date = new Date().toISOString().split("T")[0];
    return createWorkbookStreamResponse(
      workbook,
      `rekap-formatif-${programLabel.toLowerCase()}-${classLevel}-${semesterValue.toLowerCase()}-${date}.xlsx`,
    );
  } catch (error) {
    console.error("Failed to export formative Excel report", error);
    return NextResponse.json(
      { error: "Failed to export formative Excel report" },
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
