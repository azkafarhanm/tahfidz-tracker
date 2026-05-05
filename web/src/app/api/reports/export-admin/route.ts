import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { getAdminReportData, getTeacherReportData } from "@/lib/reports";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [adminData, teachers] = await Promise.all([
    getAdminReportData(),
    prisma.teacher.findMany({
      where: { isActive: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TahfidzFlow";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Ringkasan");
  summarySheet.columns = [
    { header: "Metrik", key: "metric", width: 25 },
    { header: "Nilai", key: "value", width: 15 },
  ];
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF064E3B" },
  };
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  [
    { metric: "Total Guru Aktif", value: adminData.totalTeachers },
    { metric: "Total Santri Aktif", value: adminData.totalStudents },
    { metric: "Total Hafalan", value: adminData.totalHafalan },
    { metric: "Total Murojaah", value: adminData.totalMurojaah },
    { metric: "Target Aktif", value: adminData.totalActiveTargets },
  ].forEach((row) => summarySheet.addRow(row));

  const teacherSheet = workbook.addWorksheet("Data Guru");
  teacherSheet.columns = [
    { header: "Nama Guru", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Jumlah Santri", key: "studentCount", width: 15 },
    { header: "Jumlah Halaqah", key: "classGroupCount", width: 15 },
  ];
  teacherSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF064E3B" },
  };
  teacherSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  adminData.teachers.forEach((t) =>
    teacherSheet.addRow({
      name: t.fullName,
      email: t.email,
      studentCount: t.studentCount,
      classGroupCount: t.classGroupCount,
    }),
  );

  for (const teacher of teachers) {
    const data = await getTeacherReportData(teacher.id);
    const sheetName = teacher.fullName.substring(0, 28);
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = [
      { header: "Nama Santri", key: "name", width: 25 },
      { header: "Halaqah", key: "halaqah", width: 20 },
      { header: "Level", key: "level", width: 10 },
      { header: "Hafalan", key: "hafalanCount", width: 10 },
      { header: "Murojaah", key: "murojaahCount", width: 10 },
      { header: "Skor", key: "avgScore", width: 10 },
      { header: "Ayat Terakhir", key: "lastRange", width: 22 },
      { header: "Status", key: "lastStatus", width: 16 },
      { header: "Perlu Cek", key: "needsReview", width: 12 },
    ];
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF064E3B" },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    data.students.forEach((s) =>
      sheet.addRow({
        name: s.fullName,
        halaqah: s.halaqahName,
        level: s.halaqahLevel,
        hafalanCount: s.hafalanCount,
        murojaahCount: s.murojaahCount,
        avgScore: s.avgScore || "-",
        lastRange: s.lastRange,
        lastStatus: s.lastStatus,
        needsReview: s.needsReview ? "Ya" : "Tidak",
      }),
    );
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laporan-admin-${date}.xlsx"`,
    },
  });
}
