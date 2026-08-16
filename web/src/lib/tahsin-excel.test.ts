import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
import { RecordStatus, Semester } from "@/generated/prisma-next/enums";
import { buildTahsinWorkbook, type TahsinWorkbookInput } from "@/lib/tahsin-excel";

vi.mock("@/lib/summative", () => ({ semesterLabel: () => "Ganjil" }));
vi.mock("@/lib/tahsin", () => ({ formatTahsinPageRange: (start: number, end: number | null) => end === null || start === end ? String(start) : `${start}\u2013${end}` }));

function record(overrides: Partial<TahsinWorkbookInput["exportData"]["records"][number]> = {}) {
  return { id: "r1", studentId: "a", teacherId: "t", jilid: 1, startPage: 1, endPage: 2, date: new Date("2026-08-10"), score: 85, status: RecordStatus.CUKUP, notes: null, academicYear: "2026/2027", semester: Semester.GANJIL, createdAt: new Date("2026-08-10T01:00:00Z"), updatedAt: new Date("2026-08-10T01:00:00Z"), meetingId: "m1", meeting: { meetingNumber: 1, timeline: { runNumber: 1 } }, ...overrides } as TahsinWorkbookInput["exportData"]["records"][number];
}
function input(records: TahsinWorkbookInput["exportData"]["records"]): TahsinWorkbookInput {
  return { academicYear: "2026/2027", classLevel: 7, semester: Semester.GANJIL, schoolName: "Flow", exportData: { students: [{ id: "a", fullName: "Ahmad", academicClass: { name: "7A" } }, { id: "b", fullName: "Budi", academicClass: { name: "7B" } }, { id: "c", fullName: "Citra", academicClass: { name: "7C" } }], records } };
}

describe("Tahsin Excel matrix", () => {
  it("creates class sheets and compact three-line meeting cells", () => {
    const workbook = new ExcelJS.Workbook();
    buildTahsinWorkbook(workbook, input([record({ notes: "Tajwid" })]));
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["7A", "7B", "7C"]);
    const sheet = workbook.getWorksheet("7A")!;
    expect(sheet.getCell("D8").value).toBe("J1 · 1–2\n85 · Cukup\nTajwid");
    expect(sheet.getCell("D8").value).not.toContain("Catatan Mutabaah");
    expect(sheet.getColumn("D").width).toBe(20);
    expect(sheet.getColumn("A").width).toBe(5);
    expect(sheet.getColumn("C").width).toBe(8);
    expect(sheet.getColumn("E").width).toBe(10);
    expect(sheet.getColumn("F").width).toBe(14);
    expect(sheet.getColumn("G").width).toBe(38);
    expect(sheet.getColumn("D").alignment).toMatchObject({ vertical: "middle", wrapText: true });
    expect(sheet.getRow(7).height).toBe(32);
    expect(sheet.getRow(7).alignment).toMatchObject({ vertical: "middle", wrapText: true });
  });

  it("keeps latest meeting record, excludes legacy, and calculates average", () => {
    const workbook = new ExcelJS.Workbook();
    buildTahsinWorkbook(workbook, input([record({ id: "old", score: 80 }), record({ id: "new", score: 90, date: new Date("2026-08-11") }), record({ id: "p2", score: null, meetingId: "m2", meeting: { meetingNumber: 2, timeline: { runNumber: 1 } }, notes: "Makharij" }), record({ id: "legacy", score: 99, meetingId: null, meeting: null })]));
    const sheet = workbook.getWorksheet("7A")!;
    expect(sheet.getCell("D8").value).toContain("90");
    expect(sheet.getCell("D8").value).not.toContain("80");
    expect(sheet.getCell("D8").value).not.toContain("99");
    expect(sheet.getCell("E8").value).toContain("Makharij");
    expect(sheet.getCell("F8").value).toBe(90);
  });
});
