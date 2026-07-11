import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { addStudentDetailSheet, finalizeTableSheet } from "@/lib/excel";

describe("addStudentDetailSheet", () => {
  it("adds the standard identity header above an unchanged detail table", async () => {
    const workbook = new ExcelJS.Workbook();
    const { sheet, tableHeaderRow } = addStudentDetailSheet(
      workbook,
      "Riwayat Setoran",
      [
        { header: "Tanggal", key: "date", width: 18 },
        { header: "Tipe", key: "type", width: 12 },
      ],
      {
        studentName: "Azka",
        academicClass: "7A",
        program: "Academic",
        academicYear: "2026/2027",
        semester: "Ganjil / Genap",
      },
    );

    sheet.addRow({ date: "11 Juli 2026", type: "Hafalan" });
    finalizeTableSheet(sheet, { headerRow: tableHeaderRow });

    const serialized = await workbook.xlsx.writeBuffer();
    const reloaded = new ExcelJS.Workbook();
    await reloaded.xlsx.load(serialized);
    const result = reloaded.getWorksheet("Riwayat Setoran")!;

    expect(result.getCell("A1").text).toBe("Nama Santri : Azka");
    expect(result.getCell("A2").text).toBe("Kelas : 7A");
    expect(result.getCell("A3").text).toBe("Program : Academic");
    expect(result.getCell("A4").text).toBe("Tahun Ajaran : 2026/2027");
    expect(result.getCell("A5").text).toBe("Semester : Ganjil / Genap");
    expect(result.getCell("A6").value).toBeNull();
    expect(result.getCell("A7").value).toBe("Tanggal");
    expect(result.getCell("B7").value).toBe("Tipe");
    expect(result.getCell("A8").value).toBe("11 Juli 2026");
    expect(result.getCell("B8").value).toBe("Hafalan");
    expect(result.autoFilter).toBe("A7:B7");
    expect(result.views[0]).toMatchObject({ ySplit: 7 });
  });
});
