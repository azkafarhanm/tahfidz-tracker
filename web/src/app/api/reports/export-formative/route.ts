import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCurrentAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { getTeacherFormativeExportData } from "@/lib/formative";
import {
  formatRange,
  statusLabels,
} from "@/lib/format";
import { isSemesterValue, parseSemester, semesterLabel } from "@/lib/summative";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role === "ADMIN" || !session.user.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const semesterValue = searchParams.get("semester") ?? getSemesterForDate(new Date());
  const classLevelValue = searchParams.get("classLevel") ?? "7";

  if (!isSemesterValue(semesterValue)) {
    return NextResponse.json({ error: "Invalid semester" }, { status: 400 });
  }

  const classLevel = Number.parseInt(classLevelValue, 10);
  if (![7, 8, 9].includes(classLevel)) {
    return NextResponse.json({ error: "Invalid class level" }, { status: 400 });
  }

  const semester = parseSemester(semesterValue);
  const academicYear = getCurrentAcademicYear();
  const exportData = await getTeacherFormativeExportData(
    session.user.teacherId,
    semester,
    academicYear,
    classLevel,
  );

  const groupedRows = new Map<string, typeof exportData.rows>();
  for (const row of exportData.rows) {
    const list = groupedRows.get(row.studentId) ?? [];
    list.push(row);
    groupedRows.set(row.studentId, list);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TahfidzFlow";
  workbook.created = new Date();

  const headerFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF064E3B" },
  };
  const headerFont = {
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  const infoSheet = workbook.addWorksheet("Info");
  infoSheet.columns = [
    { header: "Keterangan", key: "key", width: 26 },
    { header: "Nilai", key: "value", width: 24 },
  ];
  infoSheet.getRow(1).fill = headerFill;
  infoSheet.getRow(1).font = headerFont;
  [
    { key: "Tahun ajaran", value: academicYear },
    { key: "Kelas", value: classLevel },
    { key: "Semester", value: semesterLabel(semester) },
    { key: "Jumlah santri", value: exportData.students.length },
    { key: "Jumlah catatan", value: exportData.rows.length },
  ].forEach((row) => infoSheet.addRow(row));

  const summarySheet = workbook.addWorksheet("Ringkasan");
  summarySheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Kelas Akademik", key: "academicClassName", width: 18 },
    { header: "Halaqah", key: "halaqahName", width: 24 },
    { header: "Hafalan", key: "hafalanCount", width: 12 },
    { header: "Murojaah", key: "murojaahCount", width: 12 },
    { header: "Total", key: "totalCount", width: 10 },
    { header: "Nilai Terakhir", key: "latestScore", width: 14 },
    { header: "Tanggal Terakhir", key: "latestDate", width: 18 },
    { header: "Rata-rata Santri", key: "averageScore", width: 16 },
  ];
  summarySheet.getRow(1).fill = headerFill;
  summarySheet.getRow(1).font = headerFont;

  exportData.students.forEach((student, index) => {
    const rows = (groupedRows.get(student.id) ?? []).sort(
      (left, right) => right.date.getTime() - left.date.getTime(),
    );
    const scores = rows
      .map((row) => row.score)
      .filter((score): score is number => score !== null);
    const hafalanCount = rows.filter((row) => row.type === "Hafalan").length;
    const murojaahCount = rows.filter((row) => row.type === "Murojaah").length;
    const latest = rows[0];
    const averageScore =
      scores.length > 0
        ? Math.round(
            (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10,
          ) / 10
        : "-";

    summarySheet.addRow({
      no: index + 1,
      studentName: student.fullName,
      academicClassName: student.academicClass?.name ?? "-",
      halaqahName: student.classGroup.name,
      hafalanCount,
      murojaahCount,
      totalCount: rows.length,
      latestScore: latest?.score ?? "-",
      latestDate: latest ? latest.date.toLocaleDateString("id-ID") : "-",
      averageScore,
    });
  });

  const detailSheet = workbook.addWorksheet("Detail Formatif");
  detailSheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Santri", key: "studentName", width: 28 },
    { header: "Kelas Akademik", key: "academicClassName", width: 18 },
    { header: "Halaqah", key: "halaqahName", width: 24 },
    { header: "Jenis", key: "type", width: 12 },
    { header: "Materi", key: "range", width: 28 },
    { header: "Nilai", key: "score", width: 10 },
    { header: "Status", key: "status", width: 18 },
    { header: "Tanggal", key: "date", width: 16 },
    { header: "Catatan", key: "notes", width: 30 },
  ];
  detailSheet.getRow(1).fill = headerFill;
  detailSheet.getRow(1).font = headerFont;

  exportData.rows.forEach((row, index) => {
    const student = exportData.students.find((item) => item.id === row.studentId);

    detailSheet.addRow({
      no: index + 1,
      studentName: row.studentName,
      academicClassName: student?.academicClass?.name ?? "-",
      halaqahName: student?.classGroup.name ?? "-",
      type: row.type,
      range: formatRange(row.surah, row.fromAyah, row.toAyah),
      score: row.score ?? "",
      status: statusLabels[row.status],
      date: row.date.toLocaleDateString("id-ID"),
      notes: row.notes ?? "",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rekap-formatif-${classLevel}-${semesterValue.toLowerCase()}-${date}.xlsx"`,
    },
  });
}
