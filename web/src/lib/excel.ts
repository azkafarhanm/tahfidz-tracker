import { PassThrough, Readable } from "node:stream";
import ExcelJS from "exceljs";

const headerFill: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF064E3B" },
};

const headerFont: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
};

export type StudentSheetIdentity = {
  studentName: string;
  academicClass: string;
  program: string;
  academicYear: string;
  semester: string;
};

export function addStudentDetailSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: Partial<ExcelJS.Column>[],
  identity: StudentSheetIdentity,
) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns;

  const identityRows = [
    ["Nama Santri", identity.studentName],
    ["Kelas", identity.academicClass],
    ["Program", identity.program],
    ["Tahun Ajaran", identity.academicYear],
    ["Semester", identity.semester],
  ];
  const tableHeaderRow = identityRows.length + 2;

  sheet.spliceRows(
    1,
    0,
    ...identityRows.map(([label, value]) => [`${label} : ${value}`]),
    [],
  );

  for (let rowNumber = 1; rowNumber < tableHeaderRow - 1; rowNumber += 1) {
    sheet.mergeCells(rowNumber, 1, rowNumber, columns.length);
    const cell = sheet.getCell(rowNumber, 1);
    const [label, value] = identityRows[rowNumber - 1];
    cell.value = {
      richText: [
        {
          font: { bold: true, color: { argb: "FF064E3B" } },
          text: `${label} : `,
        },
        { text: value },
      ],
    };
    cell.alignment = { vertical: "middle" };
    sheet.getRow(rowNumber).height = 20;
  }

  return { sheet, tableHeaderRow };
}

function toColumnLetter(index: number) {
  let current = index;
  let output = "";

  while (current > 0) {
    const remainder = (current - 1) % 26;
    output = String.fromCharCode(65 + remainder) + output;
    current = Math.floor((current - 1) / 26);
  }

  return output;
}

export function applyHeaderStyle(sheet: ExcelJS.Worksheet, headerRow = 1) {
  const row = sheet.getRow(headerRow);
  row.fill = headerFill;
  row.font = headerFont;
  row.alignment = { vertical: "middle" };
  row.height = 22;
}

export function finalizeTableSheet(
  sheet: ExcelJS.Worksheet,
  options?: {
    headerRow?: number;
    wrapColumns?: Array<string | number>;
    centerColumns?: Array<string | number>;
    rightColumns?: Array<string | number>;
  },
) {
  const headerRow = options?.headerRow ?? 1;
  const columnCount = sheet.columnCount;

  applyHeaderStyle(sheet, headerRow);
  sheet.views = [{ state: "frozen", ySplit: headerRow }];

  if (columnCount > 0) {
    const endColumn = toColumnLetter(columnCount);
    sheet.autoFilter = `A${headerRow}:${endColumn}${headerRow}`;
  }

  for (const key of options?.wrapColumns ?? []) {
    sheet.getColumn(key).alignment = {
      vertical: "top",
      wrapText: true,
    };
  }

  for (const key of options?.centerColumns ?? []) {
    sheet.getColumn(key).alignment = {
      vertical: "top",
      horizontal: "center",
    };
  }

  for (const key of options?.rightColumns ?? []) {
    sheet.getColumn(key).alignment = {
      vertical: "top",
      horizontal: "right",
    };
  }

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRow) {
      return;
    }

    row.alignment = { vertical: "top" };
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });
}

export function createWorkbookStreamResponse(
  workbook: ExcelJS.Workbook,
  filename: string,
) {
  const stream = new PassThrough();

  void workbook.xlsx
    .write(stream)
    .then(() => {
      stream.end();
    })
    .catch((error) => {
      stream.destroy(error instanceof Error ? error : new Error(String(error)));
    });

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
