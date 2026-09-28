import { NextResponse } from "next/server";
import { getFoundationReportData, validatePeriod } from "@/lib/foundation-report-data";
import { buildFoundationReportPdfSections } from "@/lib/foundation-report-pdf";
import { createPdfStreamResponse } from "@/lib/pdf";
import { getRequestSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The same foundation report as the Excel file, laid out student by student. */
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
    return createPdfStreamResponse(
      "Laporan Perkembangan Tahfidz Santri Boarding",
      buildFoundationReportPdfSections(data),
      `laporan-yayasan-boarding-${from}_${to}.pdf`,
    );
  } catch (error) {
    console.error("Failed to export foundation report PDF", error);
    return NextResponse.json({ error: "Failed to export foundation report" }, { status: 500 });
  }
}
