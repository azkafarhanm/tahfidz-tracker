import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createWorkbookStreamResponse, finalizeTableSheet } from "@/lib/excel";
import { getStudentExportBundle } from "@/lib/reports";
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
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 },
      );
    }

    const exportBundle = await getStudentExportBundle(studentId, teacherId, "id");
    if (!exportBundle) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { progress: data, summativeScores } = exportBundle;
    const tasmiRecords = exportBundle.tasmiRecords ?? [];

    const isBoarding = data.programType === "BOARDING";
    const programLabel = isBoarding ? "Boarding" : "Akademik";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TahfidzFlow";
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet("Ringkasan");
    summarySheet.columns = [
      { header: "Metrik", key: "metric", width: 25 },
      { header: "Nilai", key: "value", width: 18 },
    ];
    [
      { metric: "Program", value: programLabel },
      { metric: "Nama Santri", value: data.fullName },
      { metric: "Halaqah", value: data.halaqahName },
      { metric: "Kelas", value: data.academicClassName },
      { metric: "Total Hafalan", value: data.hafalanCount },
      { metric: "Total Murojaah", value: data.murojaahCount },
      { metric: "Total Tasmi'", value: tasmiRecords.length },
      { metric: "Rata-rata Skor", value: data.avgScore || "-" },
    ].forEach((row) => summarySheet.addRow(row));
    finalizeTableSheet(summarySheet);

    const historySheet = workbook.addWorksheet("Riwayat");
    historySheet.columns = [
      { header: "Tanggal", key: "date", width: 18 },
      { header: "Tipe", key: "type", width: 12 },
      { header: "Ayat", key: "range", width: 22 },
      { header: "Skor", key: "score", width: 10 },
      { header: "Status", key: "status", width: 16 },
    ];
    data.records.forEach((r) => {
      const row = historySheet.addRow({
        date: r.date,
        type: r.type,
        range: r.range,
        score: r.score ?? "-",
        status: r.status,
      });
      if (r.needsReview) {
        row.getCell("status").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF3CD" },
        };
      }
    });
    finalizeTableSheet(historySheet, {
      wrapColumns: ["range", "status"],
      centerColumns: ["score"],
    });

    if (tasmiRecords.length > 0) {
      const tasmiSheet = workbook.addWorksheet("Tasmi");
      tasmiSheet.columns = [
        { header: "Tanggal", key: "date", width: 18 },
        { header: "Semester", key: "semester", width: 12 },
        { header: "Juz", key: "juz", width: 8 },
        { header: "Nilai", key: "grade", width: 15 },
        { header: "Status", key: "status", width: 12 },
        { header: "Penguji", key: "examinerName", width: 25 },
        { header: "Catatan", key: "notes", width: 30 },
      ];
      tasmiRecords.forEach((t) =>
        tasmiSheet.addRow({
          date: t.date,
          semester: t.semester,
          juz: t.juz,
          grade: t.grade,
          status: t.status,
          examinerName: t.examinerName,
          notes: t.notes ?? "",
        }),
      );
      finalizeTableSheet(tasmiSheet, {
        wrapColumns: ["examinerName", "notes"],
        centerColumns: ["semester", "juz"],
      });
    }

    if (data.activeTargets.length > 0) {
      const targetSheet = workbook.addWorksheet("Target Aktif");
      targetSheet.columns = [
        { header: "Tipe", key: "type", width: 12 },
        { header: "Ayat", key: "range", width: 22 },
        { header: "Mulai", key: "startDate", width: 18 },
        { header: "Target Selesai", key: "endDate", width: 18 },
        { header: "Catatan", key: "notes", width: 30 },
      ];
      data.activeTargets.forEach((t) => targetSheet.addRow(t));
      finalizeTableSheet(targetSheet, {
        wrapColumns: ["range", "notes"],
      });
    }

    if (summativeScores.length > 0) {
      const summativeSheet = workbook.addWorksheet("Nilai Sumatif");
      summativeSheet.columns = [
        { header: "Semester", key: "semester", width: 12 },
        { header: "No. Surah", key: "surahNumber", width: 10 },
        { header: "Surah", key: "surahName", width: 22 },
        { header: "Nilai", key: "score", width: 10 },
        { header: "Catatan", key: "notes", width: 30 },
      ];
      summativeScores.forEach((s) =>
        summativeSheet.addRow({
          semester: s.semester === "GANJIL" ? "Ganjil" : "Genap",
          surahNumber: s.surahNumber,
          surahName: s.surahName,
          score: s.score,
          notes: s.notes ?? "",
        }),
      );
      finalizeTableSheet(summativeSheet, {
        wrapColumns: ["surahName", "notes"],
        centerColumns: ["semester", "surahNumber", "score"],
      });
    }

    const safeName = data.fullName.replace(/\s+/g, "-").toLowerCase();
    const date = new Date().toISOString().split("T")[0];
    return createWorkbookStreamResponse(
      workbook,
      `progres-${safeName}-${programLabel.toLowerCase()}-${date}.xlsx`,
    );
  } catch (error) {
    console.error("Failed to export student Excel report", error);
    return NextResponse.json(
      { error: "Failed to export student Excel report" },
      { status: 500 },
    );
  }
}
