import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTeacherReportData } from "@/lib/reports";
import { generatePdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === "ADMIN" || !session.user.teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getTeacherReportData(session.user.teacherId);

    const pdfBuffer = await generatePdf("Laporan Guru - TahfidzFlow", [
      { type: "title", text: "Laporan Guru" },
      { type: "subtitle", text: "Ringkasan" },
      {
        type: "cards",
        items: [
          { label: "SANTRI", value: data.studentCount },
          { label: "HAFALAN", value: data.totalHafalan },
          { label: "MUROJAAH", value: data.totalMurojaah },
          { label: "SKOR", value: data.avgScore || "-" },
          { label: "PERLU CEK", value: data.needsReviewCount },
          { label: "TARGET", value: data.activeTargetCount },
        ],
      },
      ...(data.classGroups.length > 0
        ? [
            { type: "subtitle" as const, text: "Halaqah" },
            {
              type: "table" as const,
              headers: ["Nama", "Level", "Jumlah Santri"],
              rows: data.classGroups.map((cg) => [
                cg.name,
                cg.level,
                String(cg.studentCount),
              ]),
            },
          ]
        : []),
      { type: "subtitle", text: "Progres Santri" },
      {
        type: "table",
        headers: ["Nama", "Halaqah", "Hafalan", "Murojaah", "Skor", "Status"],
        rows: data.students.map((s) => [
          s.fullName,
          s.halaqahName,
          String(s.hafalanCount),
          String(s.murojaahCount),
          String(s.avgScore || "-"),
          s.needsReview ? "Perlu Cek" : s.lastStatus,
        ]),
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
