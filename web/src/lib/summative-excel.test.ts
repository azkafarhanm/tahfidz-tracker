import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
import { Semester } from "@/generated/prisma-next/enums";
import {
  buildBoardingSummativeWorkbook,
  buildFormativeWorkbook,
  buildSummativeWorkbook,
} from "@/lib/summative-excel";

vi.mock("@/lib/summative", () => ({
  semesterLabel: () => "Ganjil",
}));

describe("buildFormativeWorkbook", () => {
  it("reuses the assessment template with meeting columns", () => {
    const workbook = new ExcelJS.Workbook();

    buildFormativeWorkbook(workbook, {
      academicYear: "2026/2027",
      classLevel: 7,
      semester: Semester.GANJIL,
      schoolName: "TahfidzFlow",
      students: [
        {
          id: "student-1",
          fullName: "Akun Contoh",
          academicClassName: "7A",
          averageScore: 87.5,
        },
      ],
      rows: [
        { studentId: "student-1", notes: "Pertahankan konsistensi" },
      ],
      scoresByStudent: new Map([["student-1", [85, 90, ""]]]),
      meetingCount: 3,
    });

    const sheet = workbook.getWorksheet("7A");
    expect(sheet).toBeDefined();
    expect(sheet!.getCell("A1").value).toBe("DAFTAR NILAI FORMATIF TAHFIDZ");
    expect(sheet!.getCell("A1").isMerged).toBe(true);
    expect(sheet!.getCell("D6").value).toBe("PENILAIAN");
    expect(sheet!.getCell("D7").value).toBe("Pertemuan 1");
    expect(sheet!.getCell("E7").value).toBe("Pertemuan 2");
    expect(sheet!.getCell("F7").value).toBe("Pertemuan 3");
    expect(sheet!.getCell("D7").isMerged).toBe(true);
    expect(sheet!.getCell("D7").alignment?.textRotation).toBe(90);
    expect(sheet!.getCell("D7").border?.top?.style).toBe("thin");
    expect(sheet!.getCell("G7").value).toBe("RERATA");
    expect(sheet!.getCell("H7").value).toBe("KET.");
    expect(sheet!.getCell("I6").value).toBe("TAHSIN");
    expect(sheet!.getCell("J6").value).toBe("CATATAN MUTABAAH");
    expect(sheet!.getCell("D9").value).toBe(85);
    expect(sheet!.getCell("E9").value).toBe(90);
    expect(sheet!.getCell("F9").value).toBe("");
    expect(sheet!.getCell("G9").value).toBe(87.5);
    expect(sheet!.getCell("J9").value).toBe("Pertahankan konsistensi");
  });

  it("preserves the existing summative template behavior", () => {
    const workbook = new ExcelJS.Workbook();

    buildSummativeWorkbook(workbook, {
      academicYear: "2026/2027",
      classLevel: 7,
      semester: Semester.GANJIL,
      schoolName: "TahfidzFlow",
      students: [
        {
          id: "student-1",
          fullName: "Akun Contoh",
          academicClassName: "7A",
          averageScore: 88,
        },
      ],
      rows: [
        {
          studentId: "student-1",
          studentName: "Akun Contoh",
          academicClassName: "7A",
          halaqahName: "Halaqah Contoh",
          classLevel: 7,
          semester: Semester.GANJIL,
          surahNumber: 78,
          surahName: "An-Naba",
          surahArabicName: "النبإ",
          score: 88,
          notes: "Baik",
          createdAt: new Date("2026-07-10T08:00:00+07:00"),
        },
      ],
      targets: [],
    });

    const sheet = workbook.getWorksheet("7A");
    expect(sheet!.getCell("A1").value).toBe("DAFTAR NILAI SUMATIF TAHFIDZ");
    expect(sheet!.getCell("D7").value).toBe("JUZ 30");
    expect(sheet!.getCell("D8").value).toBe("An-Naba");
    expect(sheet!.getCell("D9").value).toBe(88);
  });
});

describe("buildBoardingSummativeWorkbook", () => {
  it("renders ordered class sheets with vertical student assessment blocks", () => {
    const workbook = new ExcelJS.Workbook();

    buildBoardingSummativeWorkbook(workbook, {
      academicYear: "2026/2027",
      semester: Semester.GANJIL,
      schoolName: "TahfidzFlow",
      students: [
        {
          id: "student-8",
          fullName: "Santri Kelas Delapan",
          classLevel: 8,
          halaqahName: "Halaqah Umar",
        },
        {
          id: "student-7",
          fullName: "Santri Kelas Tujuh",
          classLevel: 7,
          halaqahName: "Halaqah Ali",
        },
      ],
      rows: [
        {
          studentId: "student-7",
          studentName: "Santri Kelas Tujuh",
          academicClassName: "7",
          halaqahName: "Halaqah Ali",
          classLevel: 7,
          semester: Semester.GANJIL,
          surahNumber: 80,
          surahName: "Abasa",
          surahArabicName: "Abasa",
          score: 85,
          notes: null,
          createdAt: new Date("2026-07-10T08:00:00+07:00"),
        },
        {
          studentId: "student-7",
          studentName: "Santri Kelas Tujuh",
          academicClassName: "7",
          halaqahName: "Halaqah Ali",
          classLevel: 7,
          semester: Semester.GANJIL,
          surahNumber: 78,
          surahName: "An-Naba",
          surahArabicName: "An-Naba",
          score: 90,
          notes: null,
          createdAt: new Date("2026-07-09T08:00:00+07:00"),
        },
      ],
    });

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Info",
      "Kelas 7",
      "Kelas 8",
    ]);

    const classSheet = workbook.getWorksheet("Kelas 7")!;
    expect(classSheet.columnCount).toBe(2);
    expect(classSheet.getCell("A1").value).toBe("Data Santri");
    expect(classSheet.getCell("A2").value).toBe("Nama Santri :");
    expect(classSheet.getCell("B2").value).toBe("Santri Kelas Tujuh");
    expect(classSheet.getCell("A3").value).toBe("Kelas :");
    expect(classSheet.getCell("B3").value).toBe("7");
    expect(classSheet.getCell("A6").value).toBe("Surat");
    expect(classSheet.getCell("B6").value).toBe("Nilai");
    expect(classSheet.getCell("A7").value).toBe("An-Naba");
    expect(classSheet.getCell("B7").value).toBe(90);
    expect(classSheet.getCell("A8").value).toBe("Abasa");
    expect(classSheet.getCell("B8").value).toBe(85);
    expect(classSheet.getCell("A10").value).toBe("Total Penilaian :");
    expect(classSheet.getCell("B10").value).toBe("2");
    expect(classSheet.getCell("A11").value).toBe("Surat Terakhir :");
    expect(classSheet.getCell("B11").value).toBe("Abasa");
  });

  it("supports prefixed sheet names for combined teacher reports", () => {
    const workbook = new ExcelJS.Workbook();

    buildBoardingSummativeWorkbook(workbook, {
      academicYear: "2026/2027",
      semester: Semester.GANJIL,
      schoolName: "TahfidzFlow",
      students: [
        {
          id: "student-7",
          fullName: "Santri Kelas Tujuh",
          classLevel: 7,
          halaqahName: "Halaqah Ali",
        },
      ],
      rows: [],
      sheetNamePrefix: "Brd Sum Ganjil ",
    });

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Brd Sum Ganjil Info",
      "Brd Sum Ganjil Kelas 7",
    ]);
    expect(workbook.getWorksheet("Brd Sum Ganjil Kelas 7")!.getCell("B2").value).toBe("Santri Kelas Tujuh");
  });
});
