import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { getTeacherReportData } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role === "ADMIN" || !session.user.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getTeacherReportData(session.user.teacherId);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TahfidzFlow";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Ringkasan");
  summarySheet.columns = [
    { header: "Metrik", key: "metric", width: 25 },
    { header: "Nilai", key: "value", width: 15 },
  ];
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF064E3B" },
  };
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  const summaryData = [
    { metric: "Jumlah Santri Aktif", value: data.studentCount },
    { metric: "Total Hafalan", value: data.totalHafalan },
    { metric: "Total Murojaah", value: data.totalMurojaah },
    { metric: "Rata-rata Skor", value: data.avgScore || "-" },
    { metric: "Perlu Cek / Murojaah", value: data.needsReviewCount },
    { metric: "Target Aktif", value: data.activeTargetCount },
  ];
  summaryData.forEach((row) => summarySheet.addRow(row));

  const studentSheet = workbook.addWorksheet("Progres Santri");
  studentSheet.columns = [
    { header: "Nama", key: "name", width: 25 },
    { header: "Halaqah", key: "halaqah", width: 20 },
    { header: "Level", key: "level", width: 10 },
    { header: "Kelas", key: "class", width: 12 },
    { header: "Hafalan", key: "hafalanCount", width: 10 },
    { header: "Murojaah", key: "murojaahCount", width: 10 },
    { header: "Skor Rata-rata", key: "avgScore", width: 15 },
    { header: "Ayat Terakhir", key: "lastRange", width: 22 },
    { header: "Tanggal Terakhir", key: "lastActivity", width: 18 },
    { header: "Status", key: "lastStatus", width: 16 },
    { header: "Perlu Cek", key: "needsReview", width: 12 },
  ];
  studentSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF064E3B" },
  };
  studentSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  data.students.forEach((s) => {
    const row = studentSheet.addRow({
      name: s.fullName,
      halaqah: s.halaqahName,
      level: s.halaqahLevel,
      class: s.academicClassName,
      hafalanCount: s.hafalanCount,
      murojaahCount: s.murojaahCount,
      avgScore: s.avgScore || "-",
      lastRange: s.lastRange,
      lastActivity: s.lastActivity,
      lastStatus: s.lastStatus,
      needsReview: s.needsReview ? "Ya" : "Tidak",
    });
    if (s.needsReview) {
      row.getCell("needsReview").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF3CD" },
      };
    }
  });

  if (data.classGroups.length > 0) {
    const halaqahSheet = workbook.addWorksheet("Halaqah");
    halaqahSheet.columns = [
      { header: "Nama Halaqah", key: "name", width: 25 },
      { header: "Level", key: "level", width: 12 },
      { header: "Jumlah Santri", key: "studentCount", width: 15 },
    ];
    halaqahSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF064E3B" },
    };
    halaqahSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    data.classGroups.forEach((cg) => halaqahSheet.addRow(cg));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laporan-guru-${date}.xlsx"`,
    },
  });
}
