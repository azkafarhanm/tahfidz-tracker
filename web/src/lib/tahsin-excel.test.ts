import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
import { RecordStatus, Semester } from "@/generated/prisma-next/enums";
import { buildTahsinWorkbook, type TahsinWorkbookInput } from "@/lib/tahsin-excel";

vi.mock("@/lib/summative", () => ({
  semesterLabel: () => "Ganjil",
}));

vi.mock("@/lib/tahsin", () => ({
  formatTahsinPageRange: (startPage: number, endPage: number | null) =>
    endPage === null || endPage === startPage
      ? String(startPage)
      : `${startPage}–${endPage}`,
}));

function makeInput(
  records: TahsinWorkbookInput["exportData"]["records"],
): TahsinWorkbookInput {
  return {
    academicYear: "2026/2027",
    classLevel: 7,
    semester: Semester.GANJIL,
    schoolName: "TahfidzFlow",
    exportData: {
      students: [
        {
          id: "student-1",
          fullName: "Ahmad Santri",
          academicClass: { name: "7A" },
        },
      ],
      records,
    },
  };
}

function makeRecord(
  overrides: Partial<TahsinWorkbookInput["exportData"]["records"][number]>,
): TahsinWorkbookInput["exportData"]["records"][number] {
  return {
    id: "record-1",
    studentId: "student-1",
    teacherId: "teacher-1",
    jilid: 1,
    startPage: 5,
    endPage: null,
    date: new Date("2026-08-10T00:00:00.000Z"),
    score: 92,
    status: RecordStatus.LANCAR,
    notes: null,
    academicYear: "2026/2027",
    semester: Semester.GANJIL,
    createdAt: new Date("2026-08-10T01:00:00.000Z"),
    updatedAt: new Date("2026-08-10T01:00:00.000Z"),
    ...overrides,
    meetingId: overrides.meetingId ?? null,
    meeting: overrides.meeting ?? null,
  };
}

describe("buildTahsinWorkbook", () => {
  it("renders the Tahsin report header and deterministic meeting entries", () => {
    const workbook = new ExcelJS.Workbook();

    buildTahsinWorkbook(workbook, makeInput([
      makeRecord({
        id: "record-later",
        date: new Date("2026-08-12T00:00:00.000Z"),
        createdAt: new Date("2026-08-12T01:00:00.000Z"),
        jilid: 2,
        startPage: 5,
        endPage: 8,
        score: 75,
        status: RecordStatus.CUKUP,
        notes: "Perbaiki makhraj.",
      }),
      makeRecord({
        id: "record-earlier",
        date: new Date("2026-08-10T00:00:00.000Z"),
        createdAt: new Date("2026-08-10T01:00:00.000Z"),
        status: RecordStatus.PERLU_MUROJAAH,
        notes: "Ulangi halaman ini.",
      }),
    ]));

    const sheet = workbook.getWorksheet("Penilaian Tahsin")!;
    expect(sheet.getCell("A1").value).toBe("PENILAIAN TAHSIN");
    expect(sheet.getCell("A2").value).toBe("METODE ILMAN WA RUUHAN");
    expect(sheet.getCell("A4").value).toBe("TAHUN AJARAN 2026/2027");
    expect(sheet.getCell("A5").value).toBe("SEMESTER GANJIL - KELAS 7");
    expect((sheet.getRow(7).values as ExcelJS.CellValue[]).slice(1)).toEqual([
      "No",
      "Nama Santri",
      "Kelas",
      "Penilaian / Pertemuan",
      "Jilid",
      "Halaman",
      "Nilai",
      "Status",
      "Catatan Mutabaah",
    ]);
    expect(sheet.getCell("A8").value).toBe(1);
    expect(sheet.getCell("D8").value).toBe("Pertemuan 1\n(10 Agu 2026)");
    expect(sheet.getCell("E8").value).toBe(1);
    expect(sheet.getCell("F8").value).toBe("5");
    expect(sheet.getCell("G8").value).toBe(92);
    expect(sheet.getCell("H8").value).toBe("PERLU MURAJA'AH");
    expect(sheet.getCell("I8").value).toBe("Ulangi halaman ini.");
    expect(sheet.getCell("D9").value).toBe("Pertemuan 2\n(12 Agu 2026)");
    expect(sheet.getCell("E9").value).toBe(2);
    expect(sheet.getCell("F9").value).toBe("5–8");
    expect(sheet.getCell("G9").value).toBe(75);
    expect(sheet.getCell("H9").value).toBe("CUKUP");
    expect(sheet.getCell("I9").value).toBe("Perbaiki makhraj.");
  });

  it("keeps a valid workbook for an empty Tahsin result", () => {
    const workbook = new ExcelJS.Workbook();

    buildTahsinWorkbook(workbook, makeInput([]));

    const sheet = workbook.getWorksheet("Penilaian Tahsin")!;
    expect(sheet.getCell("A8").value).toBe(
      "Belum ada penilaian Tahsin untuk filter ini.",
    );
  });
});
