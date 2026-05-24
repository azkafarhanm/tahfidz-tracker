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
