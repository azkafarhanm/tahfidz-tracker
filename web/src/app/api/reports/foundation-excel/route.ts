import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createWorkbookStreamResponse } from "@/lib/excel";
import { getFoundationReportData, validatePeriod } from "@/lib/foundation-report-data";
import { buildFoundationReportWorkbook } from "@/lib/foundation-report-excel";
import { getRequestSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Boarding progress report for the foundation, for one reporting period. */
export async function GET(request: Request) {
  try {
    const scope = await getRequestSessionScope();
    if (!scope?.teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const invalid = validatePeriod(from, to);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    const data = await getFoundationReportData(scope.teacherId, from, to);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TahfidzFlow";
    workbook.created = new Date();
    buildFoundationReportWorkbook(workbook, data);

    return createWorkbookStreamResponse(workbook, `laporan-yayasan-boarding-${from}_${to}.xlsx`);
  } catch (error) {
    console.error("Failed to export foundation report Excel", error);
    return NextResponse.json({ error: "Failed to export foundation report" }, { status: 500 });
  }
}
