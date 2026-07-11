import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { Semester } from "@/generated/prisma-next/enums";
import {
  buildFormativeWorkbook,
  buildSummativeWorkbook,
} from "@/lib/summative-excel";

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
