import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStudentProgressData } from "@/lib/reports";
import { generatePdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacherId = session.user.role === "ADMIN" ? null : session.user.teacherId;
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "studentId is required" }, { status: 400 });
  }

  const data = await getStudentProgressData(studentId, teacherId);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfBuffer = await generatePdf(`${data.fullName} - TahfidzFlow`, [
    { type: "title", text: data.fullName },
    { type: "subtitle", text: "Info" },
    {
      type: "cards",
      items: [
        { label: "HALAQAH", value: `${data.halaqahName} (${data.halaqahLevel})` },
        { label: "KELAS", value: data.academicClassName },
        { label: "HAFALAN", value: data.hafalanCount },
        { label: "MUROJAAH", value: data.murojaahCount },
        { label: "SKOR", value: data.avgScore || "-" },
      ],
    },
    ...(data.activeTargets.length > 0
      ? [
          { type: "subtitle" as const, text: "Target Aktif" },
          {
            type: "table" as const,
            headers: ["Tipe", "Ayat", "Mulai", "Target"],
            rows: data.activeTargets.map((t) => [
              t.type,
              t.range,
              t.startDate,
              t.endDate,
            ]),
          },
        ]
      : []),
    { type: "subtitle", text: "Riwayat Hafalan & Murojaah" },
    ...(data.records.length > 0
      ? [
          {
            type: "table" as const,
            headers: ["Tanggal", "Tipe", "Ayat", "Skor", "Status"],
            rows: data.records.map((r) => [
              r.date,
              r.type,
              r.range,
              String(r.score ?? "-"),
              r.status,
            ]),
          },
        ]
      : [{ type: "text" as const, text: "Belum ada catatan." }]),
  ]);

  const safeName = data.fullName.replace(/\s+/g, "-").toLowerCase();
  const date = new Date().toISOString().split("T")[0];
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="progres-${safeName}-${date}.pdf"`,
    },
  });
}
