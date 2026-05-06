import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminReportData } from "@/lib/reports";
import { generatePdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getAdminReportData();

    const pdfBuffer = await generatePdf("Laporan Admin - TahfidzFlow", [
      { type: "title", text: "Laporan Admin" },
      { type: "subtitle", text: "Ringkasan" },
      {
        type: "cards",
        items: [
          { label: "GURU", value: data.totalTeachers },
          { label: "SANTRI", value: data.totalStudents },
          { label: "HAFALAN", value: data.totalHafalan },
          { label: "MUROJAAH", value: data.totalMurojaah },
          { label: "TARGET", value: data.totalActiveTargets },
        ],
      },
      { type: "subtitle", text: "Data Guru" },
      {
        type: "table",
        headers: ["Nama", "Email", "Santri", "Halaqah"],
        rows: data.teachers.map((t) => [
          t.fullName,
          t.email,
          String(t.studentCount),
          String(t.classGroupCount),
        ]),
      },
    ]);

    const date = new Date().toISOString().split("T")[0];
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="laporan-admin-${date}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate admin PDF report", error);
    return NextResponse.json(
      { error: "Failed to generate admin PDF report" },
      { status: 500 },
    );
  }
}
