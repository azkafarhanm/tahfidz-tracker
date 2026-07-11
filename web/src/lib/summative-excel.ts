import ExcelJS from "exceljs";
import type { Semester } from "@/generated/prisma-next/enums";
import { finalizeTableSheet } from "@/lib/excel";
import type { ClassTargetSurah, SummativeExportRow } from "@/lib/summative";
import { semesterLabel } from "@/lib/summative";
import { surahList } from "@/lib/surahs";

type AssessmentExportStudent = {
  id: string;
  fullName: string;
  academicClassName: string;
  averageScore: number | null;
};

export type SummativeWorkbookInput = {
  academicYear: string;
  classLevel: number;
  semester: Semester;
  schoolName: string;
  students: AssessmentExportStudent[];
  rows: SummativeExportRow[];
  targets: ClassTargetSurah[];
  sheetNamePrefix?: string;
};

export type BoardingSummativeWorkbookInput = {
  academicYear: string;
  semester: Semester;
  schoolName: string;
  students: Array<{
    id: string;
    fullName: string;
    classLevel: number;
    halaqahName: string;
  }>;
  rows: SummativeExportRow[];
  sheetNamePrefix?: string;
};

export type FormativeWorkbookInput = {
  academicYear: string;
  classLevel: number;
  semester: Semester;
  schoolName: string;
  students: AssessmentExportStudent[];
  rows: Array<{ studentId: string; notes: string | null }>;
  scoresByStudent: Map<string, Array<number | "">>;
  meetingCount: number;
  sheetNamePrefix?: string;
};

type TargetSection = {
  label: string;
  targets: DisplayTarget[];
  mergeTargetsAcrossHeaderRows?: boolean;
};

type DisplayTarget = {
  number: number;
  scoreNumbers?: number[];
  name: string;
};

type AssessmentWorkbookInput = {
  academicYear: string;
  classLevel: number;
  semester: Semester;
  schoolName: string;
  students: AssessmentExportStudent[];
  title: string;
  sections: TargetSection[];
  notesByStudent: Map<string, string>;
  scoreByStudentAndTarget: Map<string, number>;
  sheetNamePrefix?: string;
};

const titleFont: Partial<ExcelJS.Font> = {
  bold: true,
  size: 12,
  name: "Calibri",
};

const metaFont: Partial<ExcelJS.Font> = {
  bold: true,
  size: 11,
  name: "Calibri",
};

const headerFont: Partial<ExcelJS.Font> = {
  bold: true,
  size: 10,
  name: "Calibri",
};

const bodyFont: Partial<ExcelJS.Font> = {
  size: 10,
  name: "Calibri",
};

const jakartaDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

const headerFill: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF8FAFC" },
};

const boardingHeaderFill: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF064E3B" },
};

const boardingHeaderFont: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  name: "Calibri",
  size: 10,
};

export function buildSummativeWorkbook(
  workbook: ExcelJS.Workbook,
  input: SummativeWorkbookInput,
) {
  buildAssessmentWorkbook(workbook, {
    academicYear: input.academicYear,
    classLevel: input.classLevel,
    semester: input.semester,
    schoolName: input.schoolName,
    students: input.students,
    title: "DAFTAR NILAI SUMATIF TAHFIDZ",
    sections: groupTargetsBySection(input.targets, input.classLevel),
    notesByStudent: mapNotes(input.rows),
    scoreByStudentAndTarget: mapScores(input.rows),
    sheetNamePrefix: input.sheetNamePrefix,
  });
}

export function buildBoardingSummativeWorkbook(
  workbook: ExcelJS.Workbook,
  input: BoardingSummativeWorkbookInput,
) {
  const rowsByStudent = groupSummativeRowsByStudent(input.rows);

  addBoardingSummativeInfoSheet(workbook, input);

  for (const classLevel of [7, 8, 9]) {
    const students = input.students
      .filter((student) => student.classLevel === classLevel)
      .sort((left, right) => left.fullName.localeCompare(right.fullName, "id"));

    if (students.length === 0) {
      continue;
    }

    addBoardingSummativeClassSheet(workbook, {
      classLevel,
      rowsByStudent,
      students,
      sheetNamePrefix: input.sheetNamePrefix,
    });
  }
}

export function buildFormativeWorkbook(
  workbook: ExcelJS.Workbook,
  input: FormativeWorkbookInput,
) {
  const scoreByStudentAndTarget = new Map<string, number>();
  for (const [studentId, scores] of input.scoresByStudent) {
    scores.forEach((score, index) => {
      if (score !== "") {
        scoreByStudentAndTarget.set(scoreKey(studentId, index + 1), score);
      }
    });
  }

  buildAssessmentWorkbook(workbook, {
    academicYear: input.academicYear,
    classLevel: input.classLevel,
    semester: input.semester,
    schoolName: input.schoolName,
    students: input.students,
    title: "DAFTAR NILAI FORMATIF TAHFIDZ",
    sections: [
      {
        label: "PERTEMUAN",
        mergeTargetsAcrossHeaderRows: true,
        targets: Array.from(
          { length: Math.max(1, input.meetingCount) },
          (_, index) => ({
            number: index + 1,
            name: `Pertemuan ${index + 1}`,
          }),
        ),
      },
    ],
    notesByStudent: mapNotes(input.rows),
    scoreByStudentAndTarget,
    sheetNamePrefix: input.sheetNamePrefix,
  });
}

function buildAssessmentWorkbook(
  workbook: ExcelJS.Workbook,
  input: AssessmentWorkbookInput,
) {
  const usedSheetNames = new Set<string>();
  const classGroups = groupStudentsByClass(input.students);

  if (classGroups.length === 0) {
    addAssessmentClassSheet(workbook, {
      ...input,
      className: `Kelas ${input.classLevel}`,
      students: [],
      usedSheetNames,
    });
    return;
  }

  for (const group of classGroups) {
    addAssessmentClassSheet(workbook, {
      ...input,
      className: group.className,
      students: group.students,
      usedSheetNames,
    });
  }
}

function addBoardingSummativeInfoSheet(
  workbook: ExcelJS.Workbook,
  input: BoardingSummativeWorkbookInput,
) {
  const coveredClassLevels = [7, 8, 9].filter((classLevel) =>
    input.students.some((student) => student.classLevel === classLevel),
  );
  const sheet = workbook.addWorksheet(
    safeSheetName(`${input.sheetNamePrefix ?? ""}Info`),
  );

  sheet.columns = [
    { header: "Keterangan", key: "key", width: 28 },
    { header: "Nilai", key: "value", width: 36 },
  ];
  [
    { key: "Program", value: "Boarding" },
    { key: "Sekolah", value: input.schoolName },
    { key: "Tahun ajaran", value: input.academicYear },
    { key: "Semester", value: semesterLabel(input.semester) },
    { key: "Kelas", value: coveredClassLevels.map((level) => `Kelas ${level}`).join(", ") || "-" },
    { key: "Jumlah santri", value: input.students.length },
    { key: "Jumlah penilaian", value: input.rows.length },
  ].forEach((row) => sheet.addRow(row));

  finalizeTableSheet(sheet);
}

function addBoardingSummativeClassSheet(
  workbook: ExcelJS.Workbook,
  input: {
    classLevel: number;
    students: BoardingSummativeWorkbookInput["students"];
    rowsByStudent: Map<string, SummativeExportRow[]>;
    sheetNamePrefix?: string;
  },
) {
  const sheet = workbook.addWorksheet(
    safeSheetName(`${input.sheetNamePrefix ?? ""}Kelas ${input.classLevel}`),
  );
  sheet.columns = [
    { key: "label", width: 34 },
    { key: "value", width: 16 },
  ];
  sheet.properties.defaultRowHeight = 18;
  sheet.pageSetup = {
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: {
      left: 0.35,
      right: 0.35,
      top: 0.45,
      bottom: 0.45,
      header: 0.15,
      footer: 0.15,
    },
  };

  let rowNumber = 1;
  for (const student of input.students) {
    const rows = input.rowsByStudent.get(student.id) ?? [];
    rowNumber = addBoardingStudentBlock(sheet, {
      rowNumber,
      student,
      rows,
    });
  }
}

function addBoardingStudentBlock(
  sheet: ExcelJS.Worksheet,
  input: {
    rowNumber: number;
    student: BoardingSummativeWorkbookInput["students"][number];
    rows: SummativeExportRow[];
  },
) {
  const sortedRows = [...input.rows].sort(
    (left, right) => left.surahNumber - right.surahNumber,
  );
  const latestRow = getLatestSummativeRow(input.rows);
  const blockStartRow = input.rowNumber;

  sheet.mergeCells(input.rowNumber, 1, input.rowNumber, 2);
  styleBoardingSectionHeader(sheet.getCell(input.rowNumber, 1), "Data Santri");
  input.rowNumber += 1;

  [
    ["Nama Santri :", input.student.fullName],
    ["Kelas :", String(input.student.classLevel)],
    ["Halaqah :", input.student.halaqahName],
  ].forEach(([label, value]) => {
    const row = sheet.getRow(input.rowNumber);
    row.getCell(1).value = label;
    row.getCell(2).value = value;
    row.getCell(1).font = { ...bodyFont, bold: true };
    row.getCell(2).font = bodyFont;
    input.rowNumber += 1;
  });

  input.rowNumber += 1;

  const tableHeader = sheet.getRow(input.rowNumber);
  tableHeader.getCell(1).value = "Surat";
  tableHeader.getCell(2).value = "Nilai";
  for (let column = 1; column <= 2; column += 1) {
    const cell = tableHeader.getCell(column);
    cell.fill = boardingHeaderFill;
    cell.font = boardingHeaderFont;
    cell.border = thinBorder;
    cell.alignment = { horizontal: column === 2 ? "center" : "left", vertical: "middle" };
  }
  input.rowNumber += 1;

  if (sortedRows.length === 0) {
    const row = sheet.getRow(input.rowNumber);
    row.getCell(1).value = "Belum ada penilaian";
    row.getCell(2).value = "";
    row.getCell(1).font = bodyFont;
    row.getCell(2).font = bodyFont;
    input.rowNumber += 1;
  } else {
    for (const assessment of sortedRows) {
      const row = sheet.getRow(input.rowNumber);
      row.getCell(1).value = assessment.surahName;
      row.getCell(2).value = assessment.score;
      row.getCell(1).font = bodyFont;
      row.getCell(2).font = bodyFont;
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      input.rowNumber += 1;
    }
  }

  input.rowNumber += 1;

  [
    ["Total Penilaian :", String(sortedRows.length)],
    ["Surat Terakhir :", latestRow?.surahName ?? "-"],
    ["Tanggal Terakhir :", latestRow ? jakartaDateFormatter.format(latestRow.createdAt) : "-"],
  ].forEach(([label, value]) => {
    const row = sheet.getRow(input.rowNumber);
    row.getCell(1).value = label;
    row.getCell(2).value = value;
    row.getCell(1).font = { ...bodyFont, bold: true };
    row.getCell(2).font = bodyFont;
    input.rowNumber += 1;
  });

  const blockEndRow = input.rowNumber - 1;
  applyBoardingBlockBorders(sheet, blockStartRow, blockEndRow);
  input.rowNumber += 2;

  return input.rowNumber;
}

function addAssessmentClassSheet(
  workbook: ExcelJS.Workbook,
  input: AssessmentWorkbookInput & {
    className: string;
    usedSheetNames: Set<string>;
  },
) {
  const sections = input.sections;
  const targetColumns = sections.reduce(
    (count, section) => count + section.targets.length + 2,
    0,
  );
  const firstTargetColumn = 4;
  const tahsinColumn = firstTargetColumn + targetColumns;
  const notesColumn = tahsinColumn + 1;
  const lastColumn = notesColumn;
  const titleEndColumn = Math.max(lastColumn, 8);
  const sheet = workbook.addWorksheet(
    uniqueSheetName(
      safeSheetName(`${input.sheetNamePrefix ?? ""}${input.className}`),
      input.usedSheetNames,
    ),
  );

  sheet.properties.defaultRowHeight = 18;
  sheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    horizontalCentered: true,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.35,
      bottom: 0.35,
      header: 0.15,
      footer: 0.15,
    },
  };
  sheet.views = [{ state: "frozen", xSplit: 3, ySplit: 8 }];

  for (let rowNumber = 1; rowNumber <= 4; rowNumber += 1) {
    sheet.mergeCells(rowNumber, 1, rowNumber, titleEndColumn);
    const cell = sheet.getCell(rowNumber, 1);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font = rowNumber === 1 ? titleFont : metaFont;
  }

  sheet.getCell(1, 1).value = input.title;
  sheet.getCell(2, 1).value = input.schoolName;
  sheet.getCell(3, 1).value = `TAHUN AJARAN ${input.academicYear}`;
  sheet.getCell(4, 1).value =
    `SEMESTER ${semesterLabel(input.semester).toUpperCase()} - KELAS ${input.className}`;
  sheet.getRow(1).height = 20;
  sheet.getRow(2).height = 18;
  sheet.getRow(3).height = 18;
  sheet.getRow(4).height = 18;
  sheet.getRow(5).height = 8;

  mergeHeaderCell(sheet, 6, 1, 8, 1, "NO");
  mergeHeaderCell(sheet, 6, 2, 8, 2, "NAMA");
  mergeHeaderCell(sheet, 6, 3, 8, 3, "KELAS");

  if (targetColumns > 0) {
    mergeHeaderCell(
      sheet,
      6,
      firstTargetColumn,
      6,
      firstTargetColumn + targetColumns - 1,
      "PENILAIAN",
    );
  }

  let currentColumn = firstTargetColumn;
  for (const section of sections) {
    const sectionStart = currentColumn;
    const sectionEnd = currentColumn + section.targets.length - 1;
    if (!section.mergeTargetsAcrossHeaderRows) {
      mergeHeaderCell(sheet, 7, sectionStart, 7, sectionEnd, section.label);
    }

    for (const target of section.targets) {
      if (section.mergeTargetsAcrossHeaderRows) {
        sheet.mergeCells(7, currentColumn, 8, currentColumn);
      }
      const cell = sheet.getCell(
        section.mergeTargetsAcrossHeaderRows ? 7 : 8,
        currentColumn,
      );
      cell.value = target.name;
      cell.font = { ...headerFont, size: 8 };
      cell.fill = headerFill;
      cell.border = thinBorder;
      cell.alignment = {
        horizontal: "center",
        vertical: "bottom",
        textRotation: 90,
        wrapText: false,
      };
      currentColumn += 1;
    }

    mergeHeaderCell(sheet, 7, currentColumn, 8, currentColumn, "RERATA", true);
    currentColumn += 1;
    mergeHeaderCell(sheet, 7, currentColumn, 8, currentColumn, "KET.", true);
    currentColumn += 1;
  }

  mergeHeaderCell(sheet, 6, tahsinColumn, 8, tahsinColumn, "TAHSIN", true);
  mergeHeaderCell(
    sheet,
    6,
    notesColumn,
    8,
    notesColumn,
    "CATATAN MUTABAAH",
  );

  sheet.getRow(6).height = 20;
  sheet.getRow(7).height = 20;
  sheet.getRow(8).height = 74;

  sheet.getColumn(1).width = 5;
  sheet.getColumn(2).width = 30;
  sheet.getColumn(3).width = 9;
  for (let col = firstTargetColumn; col < tahsinColumn; col += 1) {
    sheet.getColumn(col).width = 4;
  }
  for (const summaryColumn of getSectionSummaryColumns(sections, firstTargetColumn)) {
    sheet.getColumn(summaryColumn).width = 7;
    sheet.getColumn(summaryColumn + 1).width = 5;
  }
  sheet.getColumn(tahsinColumn).width = 8;
  sheet.getColumn(notesColumn).width = 58;

  input.students.forEach((student, index) => {
    const row = sheet.getRow(9 + index);
    row.font = bodyFont;
    row.height = 18;
    row.getCell(1).value = index + 1;
    row.getCell(2).value = student.fullName;
    row.getCell(3).value = input.className;

    let scoreColumn = firstTargetColumn;
    for (const section of sections) {
      const sectionScores: number[] = [];
      for (const target of section.targets) {
        const score = resolveTargetScore(
          input.scoreByStudentAndTarget,
          student.id,
          target,
        );
        row.getCell(scoreColumn).value = score ?? "";
        if (score !== undefined) {
          sectionScores.push(score);
        }
        scoreColumn += 1;
      }

      row.getCell(scoreColumn).value =
        sectionScores.length > 0 ? roundAverage(sectionScores) : "";
      scoreColumn += 1;
      row.getCell(scoreColumn).value = "";
      scoreColumn += 1;
    }

    row.getCell(tahsinColumn).value = "";
    row.getCell(notesColumn).value = input.notesByStudent.get(student.id) ?? "";
  });

  const lastDataRow = Math.max(8, 8 + input.students.length);
  applyTableBorders(sheet, 6, lastDataRow, 1, lastColumn);
  applyBodyAlignment(sheet, 9, lastDataRow, firstTargetColumn, notesColumn);
}

function mergeHeaderCell(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startColumn: number,
  endRow: number,
  endColumn: number,
  value: string,
  rotate = false,
) {
  sheet.mergeCells(startRow, startColumn, endRow, endColumn);
  const cell = sheet.getCell(startRow, startColumn);
  cell.value = value;
  cell.font = headerFont;
  cell.fill = headerFill;
  cell.border = thinBorder;
  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
    ...(rotate ? { textRotation: 90 as const } : {}),
  };
}

function applyTableBorders(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  startColumn: number,
  endColumn: number,
) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    for (let column = startColumn; column <= endColumn; column += 1) {
      const cell = row.getCell(column);
      cell.border = thinBorder;
      if (rowNumber <= 8) {
        cell.font = cell.font ?? headerFont;
        cell.fill = cell.fill ?? headerFill;
      }
    }
  }
}

function applyBodyAlignment(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  firstScoreColumn: number,
  notesColumn: number,
) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(2).alignment = { vertical: "middle" };
    row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };

    for (let column = firstScoreColumn; column < notesColumn; column += 1) {
      row.getCell(column).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    }

    row.getCell(notesColumn).alignment = {
      vertical: "top",
      wrapText: true,
    };
  }
}

function groupSummativeRowsByStudent(rows: SummativeExportRow[]) {
  const grouped = new Map<string, SummativeExportRow[]>();

  for (const row of rows) {
    grouped.set(row.studentId, [...(grouped.get(row.studentId) ?? []), row]);
  }

  return grouped;
}

function getLatestSummativeRow(rows: SummativeExportRow[]) {
  return rows.reduce<SummativeExportRow | null>((latest, row) => {
    if (!latest) return row;
    if (row.createdAt.getTime() > latest.createdAt.getTime()) return row;
    if (
      row.createdAt.getTime() === latest.createdAt.getTime() &&
      row.surahNumber > latest.surahNumber
    ) {
      return row;
    }
    return latest;
  }, null);
}

function styleBoardingSectionHeader(cell: ExcelJS.Cell, value: string) {
  cell.value = value;
  cell.fill = boardingHeaderFill;
  cell.font = boardingHeaderFont;
  cell.border = thinBorder;
  cell.alignment = { horizontal: "left", vertical: "middle" };
}

function applyBoardingBlockBorders(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.height = rowNumber === startRow ? 22 : 18;
    for (let column = 1; column <= 2; column += 1) {
      const cell = row.getCell(column);
      cell.border = cell.border ?? {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      cell.alignment = {
        vertical: "middle",
        ...(column === 2 && typeof cell.value === "number"
          ? { horizontal: "center" as const }
          : {}),
      };
    }
  }
}

function groupStudentsByClass(students: AssessmentExportStudent[]) {
  const grouped = new Map<string, AssessmentExportStudent[]>();
  for (const student of students) {
    const className = student.academicClassName?.trim() || "Tanpa Kelas";
    const group = grouped.get(className) ?? [];
    group.push(student);
    grouped.set(className, group);
  }

  return [...grouped.entries()]
    .map(([className, groupStudents]) => ({
      className,
      students: groupStudents.sort((left, right) =>
        left.fullName.localeCompare(right.fullName, "id"),
      ),
    }))
    .sort((left, right) => classSortKey(left.className).localeCompare(classSortKey(right.className)));
}

function groupTargetsBySection(
  targets: ClassTargetSurah[],
  classLevel: number,
): TargetSection[] {
  const sections: TargetSection[] = [
    {
      label: "JUZ 30",
      targets: surahsFromRange(78, 114),
    },
  ];

  if (classLevel >= 8) {
    sections.push({
      label: "JUZ 29",
      targets: surahsFromRange(67, 77),
    });
  }

  if (classLevel >= 9) {
    sections.push({
      label: "Surat Pilihan",
      targets: selectedSurahTargets(targets),
    });
  }

  return sections;
}

function mapScores(rows: SummativeExportRow[]) {
  const scores = new Map<string, number>();
  for (const row of rows) {
    scores.set(scoreKey(row.studentId, row.surahNumber), row.score);
  }
  return scores;
}

function mapNotes(rows: Array<{ studentId: string; notes: string | null }>) {
  const notes = new Map<string, string[]>();
  for (const row of rows) {
    const note = row.notes?.trim();
    if (!note) continue;

    const studentNotes = notes.get(row.studentId) ?? [];
    if (!studentNotes.includes(note)) {
      studentNotes.push(note);
    }
    notes.set(row.studentId, studentNotes);
  }

  return new Map(
    [...notes.entries()].map(([studentId, studentNotes]) => [
      studentId,
      studentNotes.join("\n"),
    ]),
  );
}

function scoreKey(studentId: string, surahNumber: number) {
  return `${studentId}:${surahNumber}`;
}

function safeSheetName(name: string) {
  const cleaned = name.replace(/[\\/*?:[\]]/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || "Kelas").slice(0, 31);
}

function uniqueSheetName(name: string, usedSheetNames: Set<string>) {
  let candidate = name;
  let suffix = 2;
  while (usedSheetNames.has(candidate)) {
    const marker = ` ${suffix}`;
    candidate = `${name.slice(0, 31 - marker.length)}${marker}`;
    suffix += 1;
  }
  usedSheetNames.add(candidate);
  return candidate;
}

function classSortKey(className: string) {
  const romanOrder: Record<string, string> = {
    VII: "07",
    VIII: "08",
    IX: "09",
  };
  return className.replace(/\b(VII|VIII|IX)\b/g, (match) => romanOrder[match]);
}

function surahsFromRange(start: number, end: number): DisplayTarget[] {
  return surahList
    .filter((surah) => surah.number >= start && surah.number <= end)
    .map((surah) => ({
      number: surah.number,
      name: surah.name,
    }));
}

function selectedSurahTargets(targets: ClassTargetSurah[]): DisplayTarget[] {
  const targetNumbers = new Set(targets.map((target) => target.number));
  const combinedNumbers = [62, 61].filter((number) =>
    targetNumbers.size > 0 ? targetNumbers.has(number) : true,
  );

  return [
    {
      number: 36,
      name: "Yasin",
    },
    {
      number: combinedNumbers[0] ?? 62,
      scoreNumbers: combinedNumbers.length > 0 ? combinedNumbers : [62, 61],
      name: "Al-Jumu'ah / As-Saff",
    },
  ];
}

function getSectionSummaryColumns(
  sections: TargetSection[],
  firstTargetColumn: number,
) {
  const columns: number[] = [];
  let currentColumn = firstTargetColumn;
  for (const section of sections) {
    currentColumn += section.targets.length;
    columns.push(currentColumn);
    currentColumn += 2;
  }
  return columns;
}

function roundAverage(scores: number[]) {
  return Math.round(
    (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10,
  ) / 10;
}

function resolveTargetScore(
  scores: Map<string, number>,
  studentId: string,
  target: DisplayTarget,
) {
  const scoreNumbers = target.scoreNumbers ?? [target.number];
  for (const surahNumber of scoreNumbers) {
    const score = scores.get(scoreKey(studentId, surahNumber));
    if (score !== undefined) {
      return score;
    }
  }
  return undefined;
}
