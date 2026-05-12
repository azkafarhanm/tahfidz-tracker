import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { Semester } from "@/generated/prisma-next/enums";
import {
  getSummativeGrid,
  isSemesterValue,
  parseSemester,
  semesterLabel,
} from "@/lib/summative";
import { getCurrentAcademicYear } from "@/lib/academic-year";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role === "ADMIN" || !session.user.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const semesterStr = searchParams.get("semester") || "GANJIL";
  const classLevelStr = searchParams.get("classLevel") || "7";
  if (!isSemesterValue(semesterStr)) {
    return NextResponse.json({ error: "Invalid semester" }, { status: 400 });
  }

  const semester: Semester = parseSemester(semesterStr);
  const classLevel = parseInt(classLevelStr, 10);
  const academicYear = getCurrentAcademicYear();

  if (![7, 8, 9].includes(classLevel)) {
    return NextResponse.json({ error: "Invalid classLevel" }, { status: 400 });
  }

  const gridData = await getSummativeGrid(
    classLevel,
    semester,
    session.user.teacherId,
    academicYear,
  );

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
    { header: "Keterangan", key: "key", width: 25 },
    { header: "Nilai", key: "value", width: 20 },
  ];
  infoSheet.getRow(1).fill = headerFill;
  infoSheet.getRow(1).font = headerFont;
  [
    { key: "Tahun Ajaran", value: academicYear },
    { key: "Kelas", value: classLevel },
    { key: "Semester", value: semesterLabel(semesterStr) },
    { key: "Jumlah Santri", value: gridData.students.length },
    { key: "Jumlah Surah Target", value: gridData.targets.length },
  ].forEach((row) => infoSheet.addRow(row));

  const gridSheet = workbook.addWorksheet("Nilai Sumatif");
  const columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Nama Santri", key: "name", width: 25 },
  ];

  for (const tgt of gridData.targets) {
    columns.push({
      header: `${tgt.number}. ${tgt.name}`,
      key: tgt.surahId,
      width: 14,
    });
  }

  columns.push(
    { header: "Rata-rata", key: "avg", width: 12 },
    { header: "Dinilai", key: "scored", width: 10 },
  );

  gridSheet.columns = columns;
  gridSheet.getRow(1).fill = headerFill;
  gridSheet.getRow(1).font = headerFont;

  const headerRow = gridSheet.getRow(1);
  headerRow.height = 30;

  gridData.students.forEach((student, idx) => {
    const scoreMap = new Map(
      student.scores.map((s) => [s.surahId, s.score]),
    );
    const validScores = student.scores
      .map((s) => s.score)
      .filter((s): s is number => s !== null);
    const avg =
      validScores.length > 0
        ? Math.round(
            (validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10,
          ) / 10
        : "-";

    const rowData: Record<string, string | number> = {
      no: idx + 1,
      name: student.fullName,
      avg: avg,
      scored: `${validScores.length}/${gridData.targets.length}`,
    };

    for (const tgt of gridData.targets) {
      const score = scoreMap.get(tgt.surahId);
      rowData[tgt.surahId] = score ?? "";
    }

    const row = gridSheet.addRow(rowData);

    for (let c = 3; c < 3 + gridData.targets.length; c++) {
      const cell = row.getCell(c);
      if (typeof cell.value === "number") {
        if (cell.value >= 85) {
          cell.font = { color: { argb: "FF047857" }, bold: true };
        } else if (cell.value >= 70) {
          cell.font = { color: { argb: "FFB45309" }, bold: true };
        } else if (cell.value > 0) {
          cell.font = { color: { argb: "FFB91C1C" }, bold: true };
        }
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="nilai-sumatif-kelas${classLevel}-${semesterStr.toLowerCase()}-${date}.xlsx"`,
    },
  });
}
