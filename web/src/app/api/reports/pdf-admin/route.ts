import { NextResponse } from "next/server";
import { getAdminReportData } from "@/lib/reports";
import { getRequestSessionScope } from "@/lib/session";
import { createPdfStreamResponse } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const scope = await getRequestSessionScope();
    if (!scope?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programTypeParam = searchParams.get("programType");
    const programType = programTypeParam === "ACADEMIC" || programTypeParam === "BOARDING"
      ? programTypeParam
      : undefined;

    const data = await getAdminReportData(undefined, programType);

    const isBoarding = programType === "BOARDING";
    const isAcademic = programType === "ACADEMIC";
    const programLabel = isBoarding ? "Boarding" : isAcademic ? "Akademik" : "Semua";

    const date = new Date().toISOString().split("T")[0];
    return createPdfStreamResponse(`Laporan Admin ${programLabel} - TahfidzFlow`, [
      { type: "title", text: `Laporan Admin ${programLabel}` },
      { type: "text", text: `Program: ${programLabel}` },
      { type: "text", text: "Ringkasan data guru dan santri aktif di TahfidzFlow." },
      { type: "subtitle", text: "Ringkasan" },
      {
        type: "cards",
        items: [
          { label: "PROGRAM", value: programLabel },
          { label: "GURU", value: data.totalTeachers },
          { label: "SANTRI", value: data.totalStudents },
          { label: "HAFALAN", value: data.totalHafalan },
          { label: "MUROJAAH", value: data.totalMurojaah },
          { label: "TARGET", value: data.totalActiveTargets },
        ],
      },
      { type: "subtitle", text: "Daftar Guru" },
      {
        type: "table",
        headers: ["Nama", "Email", "Santri Aktif", "Halaqah Aktif"],
        rows: data.teachers.map((t) => [
          t.fullName,
          t.email,
          String(t.studentCount),
          String(t.classGroupCount),
        ]),
      },
    ], `laporan-admin-${programLabel.toLowerCase()}-${date}.pdf`);
  } catch (error) {
    console.error("Failed to generate admin PDF report", error);
    return NextResponse.json(
      { error: "Failed to generate admin PDF report" },
      { status: 500 },
    );
  }
}
