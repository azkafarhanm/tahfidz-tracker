import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { RecordStatus } from "@/generated/prisma-next/enums";
import { finalizeTableSheet } from "@/lib/excel";
import { formatRange, halaqahLevelLabels, statusLabels } from "@/lib/format";
import { getAdminReportData } from "@/lib/reports";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [adminData, teachers, students] = await Promise.all([
      getAdminReportData(),
      prisma.teacher.findMany({
        where: { isActive: true },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true },
      }),
      prisma.student.findMany({
        where: {
          isActive: true,
          teacher: {
            isActive: true,
          },
        },
        orderBy: [{ teacher: { fullName: "asc" } }, { fullName: "asc" }],
        select: {
          id: true,
          teacherId: true,
          fullName: true,
          classGroup: {
            select: {
              name: true,
              level: true,
            },
          },
          _count: {
            select: {
              memorizationRecords: true,
              revisionRecords: true,
            },
          },
          memorizationRecords: {
            orderBy: { date: "desc" },
            take: 1,
            select: {
              surah: true,
              fromAyah: true,
              toAyah: true,
              date: true,
              status: true,
            },
          },
          revisionRecords: {
            orderBy: { date: "desc" },
            take: 1,
            select: {
              surah: true,
              fromAyah: true,
              toAyah: true,
              date: true,
              status: true,
            },
          },
        },
      }),
    ]);
    const studentIds = students.map((student) => student.id);
    const [memorizationStats, revisionStats] = studentIds.length > 0
      ? await Promise.all([
          prisma.memorizationRecord.groupBy({
            by: ["studentId"],
            where: {
              studentId: { in: studentIds },
              score: { not: null },
            },
            _avg: { score: true },
            _count: { score: true },
          }),
          prisma.revisionRecord.groupBy({
            by: ["studentId"],
            where: {
              studentId: { in: studentIds },
              score: { not: null },
            },
            _avg: { score: true },
            _count: { score: true },
          }),
        ])
      : [[], []] as const;
    const scoreStatsByStudent = new Map<string, { scoreTotal: number; count: number }>();

    for (const row of [...memorizationStats, ...revisionStats]) {
      const average = row._avg.score;
      const count = row._count.score;
      if (average === null || count === 0) continue;

      const current = scoreStatsByStudent.get(row.studentId) ?? {
        scoreTotal: 0,
        count: 0,
      };
      current.scoreTotal += average * count;
      current.count += count;
      scoreStatsByStudent.set(row.studentId, current);
    }
    const rowsByTeacher = new Map<string, Array<{
      fullName: string;
      halaqahName: string;
      halaqahLevel: string;
      hafalanCount: number;
      murojaahCount: number;
      avgScore: number;
      lastRange: string;
      lastStatus: string;
      needsReview: boolean;
    }>>();

    for (const student of students) {
      const lastHafalan = student.memorizationRecords[0];
      const lastMurojaah = student.revisionRecords[0];
      const latest = [lastHafalan, lastMurojaah]
        .filter((record): record is NonNullable<typeof lastHafalan> => Boolean(record))
        .sort((left, right) => right.date.getTime() - left.date.getTime())[0];
      const scoreStats = scoreStatsByStudent.get(student.id);
      const row = {
        fullName: student.fullName,
        halaqahName: student.classGroup.name,
        halaqahLevel: halaqahLevelLabels[student.classGroup.level],
        hafalanCount: student._count.memorizationRecords,
        murojaahCount: student._count.revisionRecords,
        avgScore: scoreStats
          ? Math.round(scoreStats.scoreTotal / scoreStats.count)
          : 0,
        lastRange: latest
          ? formatRange(latest.surah, latest.fromAyah, latest.toAyah)
          : "-",
        lastStatus: latest ? statusLabels[latest.status] : "-",
        needsReview:
          lastHafalan?.status === RecordStatus.PERLU_MUROJAAH ||
          lastMurojaah?.status === RecordStatus.PERLU_MUROJAAH,
      };
      const rows = rowsByTeacher.get(student.teacherId) ?? [];
      rows.push(row);
      rowsByTeacher.set(student.teacherId, rows);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TahfidzFlow";
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet("Ringkasan");
    summarySheet.columns = [
      { header: "Metrik", key: "metric", width: 25 },
      { header: "Nilai", key: "value", width: 15 },
    ];
    [
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

    for (const teacher of teachers) {
      const sheetName = getUniqueSheetName(teacher.fullName, usedSheetNames);
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
      const rows = rowsByTeacher.get(teacher.id) ?? [];
      rows.forEach((s) =>
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
      finalizeTableSheet(sheet, {
        wrapColumns: ["name", "halaqah", "lastRange", "lastStatus"],
        centerColumns: ["hafalanCount", "murojaahCount", "avgScore", "needsReview"],
      });
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
