import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createWorkbookStreamResponse, finalizeTableSheet } from "@/lib/excel";
import { getAdminExportBundle } from "@/lib/reports";
import { getRequestSessionScope } from "@/lib/session";

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

    const adminBundle = await getAdminExportBundle(undefined, programType);
    const adminData = adminBundle.summary;

    const isBoarding = programType === "BOARDING";
    const isAcademic = programType === "ACADEMIC";
    const programLabel = isBoarding ? "Boarding" : isAcademic ? "Akademik" : "Semua";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TahfidzFlow";
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet("Ringkasan");
    summarySheet.columns = [
      { header: "Metrik", key: "metric", width: 25 },
      { header: "Nilai", key: "value", width: 15 },
    ];
    [
      { metric: "Program", value: programLabel },
      { metric: "Total Guru Aktif", value: adminData.totalTeachers },
      { metric: "Total Santri Aktif", value: adminData.totalStudents },
      { metric: "Total Hafalan", value: adminData.totalHafalan },
      { metric: "Total Murojaah", value: adminData.totalMurojaah },
      { metric: "Target Aktif", value: adminData.totalActiveTargets },
    ].forEach((row) => summarySheet.addRow(row));
    finalizeTableSheet(summarySheet);

    const teacherSheet = workbook.addWorksheet("Data Guru");
    teacherSheet.columns = [
      { header: "Nama Guru", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Jumlah Santri", key: "studentCount", width: 15 },
      { header: "Jumlah Halaqah", key: "classGroupCount", width: 15 },
    ];
    adminData.teachers.forEach((t) =>
      teacherSheet.addRow({
        name: t.fullName,
        email: t.email,
        studentCount: t.studentCount,
        classGroupCount: t.classGroupCount,
      }),
    );
    finalizeTableSheet(teacherSheet, {
      wrapColumns: ["name", "email"],
      centerColumns: ["studentCount", "classGroupCount"],
    });

    const usedSheetNames = new Set<string>(["Ringkasan", "Data Guru"]);

    for (const teacher of adminBundle.teachers) {
      const sheetName = getUniqueSheetName(teacher.fullName, usedSheetNames);
      const sheet = workbook.addWorksheet(sheetName);
      sheet.columns = [
        { header: "Nama Santri", key: "name", width: 25 },
        { header: "Halaqah", key: "halaqah", width: 20 },
        ...(!isBoarding ? [{ header: "Level", key: "level", width: 10 }] : []),
        { header: "Hafalan", key: "hafalanCount", width: 10 },
        { header: "Murojaah", key: "murojaahCount", width: 10 },
        { header: "Skor", key: "avgScore", width: 10 },
        { header: "Ayat Terakhir", key: "lastRange", width: 22 },
        { header: "Status", key: "lastStatus", width: 16 },
        { header: "Perlu Cek", key: "needsReview", width: 12 },
      ];
      const rows = adminBundle.rowsByTeacher.get(teacher.id) ?? [];
      rows.forEach((s) =>
        sheet.addRow({
          name: s.fullName,
          halaqah: s.halaqahName,
          ...(!isBoarding ? { level: s.halaqahLevel } : {}),
          hafalanCount: s.hafalanCount,
          murojaahCount: s.murojaahCount,
          avgScore: s.avgScore || "-",
          lastRange: s.lastRange,
          lastStatus: s.lastStatus,
          needsReview: s.needsReview ? "Ya" : "Tidak",
        }),
      );
      finalizeTableSheet(sheet, {
        wrapColumns: ["name", "halaqah", "lastRange", "lastStatus"],
        centerColumns: ["hafalanCount", "murojaahCount", "avgScore", "needsReview"],
      });
    }

    const date = new Date().toISOString().split("T")[0];
    return createWorkbookStreamResponse(
      workbook,
      `laporan-admin-${programLabel.toLowerCase()}-${date}.xlsx`,
    );
  } catch (error) {
    console.error("Failed to export admin Excel report", error);
    return NextResponse.json(
      { error: "Failed to export admin Excel report" },
      { status: 500 },
    );
  }
}

function getUniqueSheetName(rawName: string, used: Set<string>) {
  const baseName = rawName
    .replace(/[\[\]:*?/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 28) || "Guru";
  let sheetName = baseName;
  let suffix = 2;

  while (used.has(sheetName)) {
    const suffixText = ` ${suffix}`;
    sheetName = `${baseName.slice(0, 31 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  used.add(sheetName);
  return sheetName;
}
