import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
import { RecordStatus, Semester } from "@/generated/prisma-next/enums";
import { buildTahsinWorkbook, type TahsinWorkbookInput } from "@/lib/tahsin-excel";

vi.mock("@/lib/summative", () => ({ semesterLabel: () => "Ganjil" }));
vi.mock("@/lib/tahsin", () => ({ formatTahsinPageRange: (start: number, end: number | null) => end === null || start === end ? String(start) : `${start}\u2013${end}` }));

function record(overrides: Partial<TahsinWorkbookInput["exportData"]["records"][number]> = {}) {
  return { id: "r1", studentId: "a", teacherId: "t", jilid: 1, startPage: 1, endPage: 2, date: new Date("2026-08-10"), score: 85, status: RecordStatus.CUKUP, notes: null, academicYear: "2026/2027", semester: Semester.GANJIL, createdAt: new Date("2026-08-10T01:00:00Z"), updatedAt: new Date("2026-08-10T01:00:00Z"), meetingId: "m1", meeting: { meetingNumber: 1, meetingDate: new Date("2026-08-16T00:00:00Z"), timeline: { runNumber: 1 } }, ...overrides } as TahsinWorkbookInput["exportData"]["records"][number];
}
function input(records: TahsinWorkbookInput["exportData"]["records"], activeMeetings?: Array<{ meetingNumber: number; meetingDate: Date }>): TahsinWorkbookInput {
  const meetings = activeMeetings ?? [...new Map(records.flatMap((item) => item.meeting ? [[item.meeting.meetingNumber, { meetingNumber: item.meeting.meetingNumber, meetingDate: item.meeting.meetingDate }]] : [])).values()];
  return { academicYear: "2026/2027", classLevel: 7, semester: Semester.GANJIL, schoolName: "Flow", exportData: { students: [{ id: "a", fullName: "Ahmad", academicClass: { name: "7A" } }, { id: "b", fullName: "Budi", academicClass: { name: "7B" } }, { id: "c", fullName: "Citra", academicClass: { name: "7C" } }], meetings, records } };
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
    expect(sheet.getCell("D7").value).toBe("P1\n(16 Agu)");
  });

  it("uses each meeting's stored date in its two-line header", () => {
    const workbook = new ExcelJS.Workbook();
    buildTahsinWorkbook(workbook, input([
      record({ id: "p1", meeting: { meetingNumber: 1, meetingDate: new Date("2026-08-16T00:00:00Z"), timeline: { runNumber: 1 } } }),
      record({ id: "p2", meetingId: "m2", meeting: { meetingNumber: 2, meetingDate: new Date("2026-08-18T00:00:00Z"), timeline: { runNumber: 1 } } }),
    ]));
    const sheet = workbook.getWorksheet("7A")!;
    expect(sheet.getCell("D7").value).toBe("P1\n(16 Agu)");
    expect(sheet.getCell("E7").value).toBe("P2\n(18 Agu)");
    expect(sheet.getColumn("D").width).toBe(20);
    expect(sheet.autoFilter).toBeDefined();
  });

  it("uses the active timeline for headers after reset, not historical record progression", () => {
    const workbook = new ExcelJS.Workbook();
    buildTahsinWorkbook(workbook, input([], [{ meetingNumber: 1, meetingDate: new Date("2026-08-21T00:00:00Z") }]));
    const sheet = workbook.getWorksheet("7A")!;
    expect(sheet.getCell("D7").value).toBe("P1\n(21 Agu)");
    expect(sheet.getCell("E7").value).toBe("Rerata");
  });

  it("keeps latest meeting record, excludes legacy, and calculates average", () => {
    const workbook = new ExcelJS.Workbook();
    buildTahsinWorkbook(workbook, input([record({ id: "old", score: 80 }), record({ id: "new", score: 90, date: new Date("2026-08-11") }), record({ id: "p2", score: null, meetingId: "m2", meeting: { meetingNumber: 2, meetingDate: new Date("2026-08-18T00:00:00Z"), timeline: { runNumber: 1 } }, notes: "Makharij" }), record({ id: "legacy", score: 99, meetingId: null, meeting: null })]));
    const sheet = workbook.getWorksheet("7A")!;
    expect(sheet.getCell("D8").value).toContain("90");
    expect(sheet.getCell("D8").value).not.toContain("80");
    expect(sheet.getCell("D8").value).not.toContain("99");
    expect(sheet.getCell("E8").value).toContain("Makharij");
    expect(sheet.getCell("F8").value).toBe(90);
  });

  it("formats numeric Rerata cells with one decimal place without changing the average value", () => {
    const workbook = new ExcelJS.Workbook();
    buildTahsinWorkbook(workbook, input([
      record({ id: "p1", score: 83, meeting: { meetingNumber: 1, meetingDate: new Date("2026-08-16T00:00:00Z"), timeline: { runNumber: 1 } } }),
      record({ id: "p2", score: 84, meetingId: "m2", meeting: { meetingNumber: 2, meetingDate: new Date("2026-08-18T00:00:00Z"), timeline: { runNumber: 1 } } }),
      record({ id: "p3", score: 84, meetingId: "m3", meeting: { meetingNumber: 3, meetingDate: new Date("2026-08-20T00:00:00Z"), timeline: { runNumber: 1 } } }),
    ]));
    const sheet = workbook.getWorksheet("7A")!;
    const rerata = sheet.getCell("G8");
    expect(rerata.value).toBe(83.66666666666667);
    expect(typeof rerata.value).toBe("number");
    expect(rerata.numFmt).toBe("0.0");
  });
});
