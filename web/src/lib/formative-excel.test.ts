import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
import {
  HalaqahLevel,
  ProgramType,
  RecordStatus,
  Semester,
} from "@/generated/prisma-next/enums";
import {
  buildBoardingFormativeProgressWorkbook,
  type BoardingFormativeProgressWorkbookInput,
} from "@/lib/formative-excel";

vi.mock("@/lib/summative", () => ({
  semesterLabel: () => "Ganjil",
}));

type ExportData = BoardingFormativeProgressWorkbookInput["exportData"];
type ExportRow = ExportData["rows"][number];

const boardingClassGroup = {
  grade: 7,
  name: "Halaqah Umar",
  level: HalaqahLevel.LOW,
  programType: ProgramType.BOARDING,
};

function makeBoardingClassGroup(grade: number, name = `Halaqah ${grade}`) {
  return {
    ...boardingClassGroup,
    grade,
    name,
  };
}

function makeRow(
  overrides: Partial<ExportRow> & Pick<ExportRow, "id" | "studentId" | "studentName" | "type" | "surah" | "fromAyah" | "toAyah" | "date">,
): ExportRow {
  return {
    academicClassName: "7",
    academicYear: "2026/2027",
    createdAt: overrides.date,
    notes: null,
    score: null,
    semester: Semester.GANJIL,
    status: RecordStatus.LANCAR,
    updatedAt: overrides.date,
    ...overrides,
  };
}

describe("buildBoardingFormativeProgressWorkbook", () => {
  it("creates Boarding progress worksheets for classes 7, 8, and 9 without academic score sheets", () => {
    const workbook = new ExcelJS.Workbook();

    buildBoardingFormativeProgressWorkbook(workbook, {
      exportData: {
        students: [
          {
            id: "student-empty",
            fullName: "Santri Kosong",
            classGroup: boardingClassGroup,
            academicClass: null,
          },
        ],
        rows: [],
      },
    });

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Kelas 7",
      "Kelas 8",
      "Kelas 9",
    ]);

    const sheet = workbook.getWorksheet("Kelas 7");
    expect(sheet).toBeDefined();
    expect((sheet!.getRow(1).values as ExcelJS.CellValue[]).slice(1)).toEqual([
      "No",
      "Nama Santri",
      "Kelas",
      "Halaqah",
      "Total Setoran Hafalan",
      "Total Setoran Murojaah",
      "Progress Hafalan",
      "Progress Murojaah",
      "Setoran Terakhir",
      "Tanggal Terakhir",
    ]);
    expect(sheet!.getCell("C2").value).toBe(7);
    expect(sheet!.getCell("E2").value).toBe(0);
    expect(sheet!.getCell("F2").value).toBe(0);
    expect(sheet!.getCell("G2").value).toBe("0 Ayat");
    expect(sheet!.getCell("H2").value).toBe("0 Ayat");
    expect(sheet!.getCell("I2").value).toBe("-");
    expect(sheet!.getCell("J2").value).toBe("-");
    expect(workbook.getWorksheet("Kelas 8")!.rowCount).toBe(1);
    expect(workbook.getWorksheet("Kelas 9")!.rowCount).toBe(1);
  });

  it("keeps each Boarding class worksheet scoped to its own students", () => {
    const workbook = new ExcelJS.Workbook();

    buildBoardingFormativeProgressWorkbook(workbook, {
      exportData: {
        students: [
          {
            id: "student-7",
            fullName: "Santri Tujuh",
            classGroup: makeBoardingClassGroup(7),
            academicClass: null,
          },
          {
            id: "student-8",
            fullName: "Santri Delapan",
            classGroup: makeBoardingClassGroup(8),
            academicClass: null,
          },
          {
            id: "student-9",
            fullName: "Santri Sembilan",
            classGroup: makeBoardingClassGroup(9),
            academicClass: null,
          },
        ],
        rows: [
          makeRow({
            id: "hafalan-7",
            studentId: "student-7",
            studentName: "Santri Tujuh",
            type: "Hafalan",
            surah: "Al-Fatihah",
            fromAyah: 1,
            toAyah: 7,
            date: new Date("2026-07-09T08:00:00+07:00"),
          }),
          makeRow({
            id: "murojaah-8",
            studentId: "student-8",
            studentName: "Santri Delapan",
            type: "Murojaah",
            surah: "Al-Baqarah",
            fromAyah: 1,
            toAyah: 3,
            date: new Date("2026-07-10T08:00:00+07:00"),
          }),
          makeRow({
            id: "hafalan-9",
            studentId: "student-9",
            studentName: "Santri Sembilan",
            type: "Hafalan",
            surah: "Al-Ikhlas",
            fromAyah: 1,
            toAyah: 4,
            date: new Date("2026-07-11T08:00:00+07:00"),
          }),
        ],
      },
    });

    expect(workbook.getWorksheet("Kelas 7")!.getCell("B2").value).toBe("Santri Tujuh");
    expect(workbook.getWorksheet("Kelas 7")!.getCell("E2").value).toBe(1);
    expect(workbook.getWorksheet("Kelas 8")!.getCell("B2").value).toBe("Santri Delapan");
    expect(workbook.getWorksheet("Kelas 8")!.getCell("F2").value).toBe(1);
    expect(workbook.getWorksheet("Kelas 9")!.getCell("B2").value).toBe("Santri Sembilan");
    expect(workbook.getWorksheet("Kelas 9")!.getCell("E2").value).toBe(1);
  });

  it("supports prefixed sheet names for combined teacher reports", () => {
    const workbook = new ExcelJS.Workbook();

    buildBoardingFormativeProgressWorkbook(workbook, {
      exportData: {
        students: [
          {
            id: "student-7",
            fullName: "Santri Tujuh",
            classGroup: boardingClassGroup,
            academicClass: null,
          },
        ],
        rows: [],
      },
      sheetNamePrefix: "Brd Fmt Ganjil ",
    });

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Brd Fmt Ganjil Kelas 7",
      "Brd Fmt Ganjil Kelas 8",
      "Brd Fmt Ganjil Kelas 9",
    ]);
    expect(workbook.getWorksheet("Brd Fmt Ganjil Kelas 7")!.getCell("B2").value).toBe("Santri Tujuh");
  });

  it("summarizes completed surah and partial ayah Hafalan without decimal juz values", () => {
    const workbook = new ExcelJS.Workbook();

    buildBoardingFormativeProgressWorkbook(workbook, {
      exportData: {
        students: [
          {
            id: "student-1",
            fullName: "Akun Contoh",
            classGroup: boardingClassGroup,
            academicClass: null,
          },
        ],
        rows: [
          makeRow({
            id: "hafalan-1",
            studentId: "student-1",
            studentName: "Akun Contoh",
            type: "Hafalan",
            surah: "Al-Baqarah",
            fromAyah: 1,
            toAyah: 286,
            date: new Date("2026-07-09T08:00:00+07:00"),
          }),
          makeRow({
            id: "hafalan-2",
            studentId: "student-1",
            studentName: "Akun Contoh",
            type: "Hafalan",
            surah: "Ali Imran",
            fromAyah: 1,
            toAyah: 15,
            date: new Date("2026-07-10T08:00:00+07:00"),
          }),
          makeRow({
            id: "hafalan-overlap",
            studentId: "student-1",
            studentName: "Akun Contoh",
            type: "Hafalan",
            surah: "Ali Imran",
            fromAyah: 10,
            toAyah: 15,
            date: new Date("2026-07-11T08:00:00+07:00"),
          }),
        ],
      },
    });

    const sheet = workbook.getWorksheet("Kelas 7")!;
    expect(sheet.getCell("E2").value).toBe(3);
    expect(sheet.getCell("G2").value).toBe("1 Surah + 15 Ayat");
    expect(sheet.getCell("I2").value).toBe("Ali Imran 10-15");
  });

  it("summarizes Hafalan as complete juz, complete surah, and remaining ayah", () => {
    const workbook = new ExcelJS.Workbook();

    buildBoardingFormativeProgressWorkbook(workbook, {
      exportData: {
        students: [
          {
            id: "student-2",
            fullName: "Santri Juz",
            classGroup: boardingClassGroup,
            academicClass: null,
          },
        ],
        rows: [
          makeRow({
            id: "juz-2",
            studentId: "student-2",
            studentName: "Santri Juz",
            type: "Hafalan",
            surah: "Al-Baqarah",
            fromAyah: 142,
            toAyah: 252,
            date: new Date("2026-07-07T08:00:00+07:00"),
          }),
          makeRow({
            id: "surah-yasin",
            studentId: "student-2",
            studentName: "Santri Juz",
            type: "Hafalan",
            surah: "Ya-Sin",
            fromAyah: 1,
            toAyah: 83,
            date: new Date("2026-07-08T08:00:00+07:00"),
          }),
          makeRow({
            id: "surah-mulk",
            studentId: "student-2",
            studentName: "Santri Juz",
            type: "Hafalan",
            surah: "Al-Mulk",
            fromAyah: 1,
            toAyah: 30,
            date: new Date("2026-07-09T08:00:00+07:00"),
          }),
          makeRow({
            id: "partial-taha",
            studentId: "student-2",
            studentName: "Santri Juz",
            type: "Hafalan",
            surah: "Taha",
            fromAyah: 1,
            toAyah: 18,
            date: new Date("2026-07-10T08:00:00+07:00"),
          }),
        ],
      },
    });

    const sheet = workbook.getWorksheet("Kelas 7")!;
    expect(sheet.getCell("G2").value).toBe("1 Juz + 2 Surah + 18 Ayat");
  });

  it("counts repeated Murojaah as valid progress", () => {
    const workbook = new ExcelJS.Workbook();

    buildBoardingFormativeProgressWorkbook(workbook, {
      exportData: {
        students: [
          {
            id: "student-3",
            fullName: "Santri Murojaah",
            classGroup: boardingClassGroup,
            academicClass: null,
          },
        ],
        rows: [
          makeRow({
            id: "murojaah-1",
            studentId: "student-3",
            studentName: "Santri Murojaah",
            type: "Murojaah",
            surah: "Al-Fatihah",
            fromAyah: 1,
            toAyah: 7,
            date: new Date("2026-07-09T08:00:00+07:00"),
          }),
          makeRow({
            id: "murojaah-2",
            studentId: "student-3",
            studentName: "Santri Murojaah",
            type: "Murojaah",
            surah: "Al-Fatihah",
            fromAyah: 1,
            toAyah: 7,
            date: new Date("2026-07-10T08:00:00+07:00"),
          }),
        ],
      },
    });

    const sheet = workbook.getWorksheet("Kelas 7")!;
    expect(sheet.getCell("F2").value).toBe(2);
    expect(sheet.getCell("H2").value).toBe("2 Surah");
  });
});
