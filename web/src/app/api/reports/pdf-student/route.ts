import { NextResponse } from "next/server";
import { getStudentExportBundle } from "@/lib/reports";
import { getRequestSessionScope } from "@/lib/session";
import { createPdfStreamResponse } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const scope = await getRequestSessionScope();
    if (!scope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = scope.isAdmin ? null : scope.teacherId;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const exportBundle = await getStudentExportBundle(studentId, teacherId, "id");
    if (!exportBundle) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { progress: data, summativeScores } = exportBundle;

    const safeName = data.fullName.replace(/\s+/g, "-").toLowerCase();
    const date = new Date().toISOString().split("T")[0];
    return createPdfStreamResponse(
      `${data.fullName} - TahfidzFlow`,
      [
        { type: "title", text: data.fullName },
        { type: "text", text: "Ringkasan progres santri." },
        { type: "subtitle", text: "Informasi Santri" },
        {
          type: "cards",
          columns: 2,
          items: [
            { label: "HALAQAH", value: data.halaqahName },
            { label: "LEVEL", value: data.halaqahLevel },
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
        { type: "subtitle", text: "Riwayat Pembelajaran" },
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
          : [{ type: "text" as const, text: "Belum ada riwayat hafalan atau murojaah pada periode ini." }]),
        ...(summativeScores.length > 0
          ? [
              { type: "subtitle" as const, text: "Nilai Sumatif" },
              {
                type: "table" as const,
                headers: ["Semester", "Surah", "Nilai"],
                rows: summativeScores.map((s) => [
                  s.semester === "GANJIL" ? "Ganjil" : "Genap",
                  `${s.surahNumber}. ${s.surahName}`,
                  String(s.score),
                ]),
              },
            ]
          : [{ type: "text" as const, text: "Belum ada nilai sumatif yang tersimpan." }]),
      ],
      `progres-${safeName}-${date}.pdf`,
    );
  } catch (error) {
    console.error("Failed to generate student PDF report", error);
    return NextResponse.json(
      { error: "Failed to generate student PDF report" },
      { status: 500 },
    );
  }
}
