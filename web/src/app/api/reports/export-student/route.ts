import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { getStudentProgressData } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacherId =
    session.user.role === "ADMIN" ? null : session.user.teacherId;
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json(
      { error: "studentId is required" },
      { status: 400 },
    );
  }

  const data = await getStudentProgressData(studentId, teacherId);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TahfidzFlow";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Ringkasan");
  summarySheet.columns = [
    { header: "Metrik", key: "metric", width: 25 },
    { header: "Nilai", key: "value", width: 18 },
  ];
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF064E3B" },
  };
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  [
    { metric: "Nama Santri", value: data.fullName },
    { metric: "Halaqah", value: data.halaqahName },
    { metric: "Level", value: data.halaqahLevel },
    { metric: "Kelas", value: data.academicClassName },
    { metric: "Total Hafalan", value: data.hafalanCount },
    { metric: "Total Murojaah", value: data.murojaahCount },
    { metric: "Rata-rata Skor", value: data.avgScore || "-" },
  ].forEach((row) => summarySheet.addRow(row));

  const historySheet = workbook.addWorksheet("Riwayat");
  historySheet.columns = [
    { header: "Tanggal", key: "date", width: 18 },
    { header: "Tipe", key: "type", width: 12 },
    { header: "Ayat", key: "range", width: 22 },
    { header: "Skor", key: "score", width: 10 },
    { header: "Status", key: "status", width: 16 },
  ];
  historySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF064E3B" },
  };
  historySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

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

  if (data.activeTargets.length > 0) {
    const targetSheet = workbook.addWorksheet("Target Aktif");
    targetSheet.columns = [
      { header: "Tipe", key: "type", width: 12 },
      { header: "Ayat", key: "range", width: 22 },
      { header: "Mulai", key: "startDate", width: 18 },
      { header: "Target Selesai", key: "endDate", width: 18 },
      { header: "Catatan", key: "notes", width: 30 },
    ];
    targetSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF064E3B" },
    };
    targetSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    data.activeTargets.forEach((t) => targetSheet.addRow(t));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const safeName = data.fullName.replace(/\s+/g, "-").toLowerCase();
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="progres-${safeName}-${date}.xlsx"`,
    },
  });
}
