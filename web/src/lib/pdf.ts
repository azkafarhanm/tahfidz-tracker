import { PassThrough, Readable } from "node:stream";
import PDFDocument from "pdfkit";

type PdfSection =
  | { type: "title"; text: string }
  | { type: "subtitle"; text: string }
  | {
      type: "cards";
      columns?: number;
      items: { label: string; value: string | number }[];
    }
  | {
      type: "table";
      headers: string[];
      rows: (string | number)[][];
    }
  | { type: "text"; text: string };

function renderPdfDocument(
  doc: InstanceType<typeof PDFDocument>,
  sections: PdfSection[],
) {
  const green = "#064e3b";
  const dark = "#0f172a";
  const muted = "#64748b";
  const lightBg = "#f1f5f9";
  const lighterBg = "#f8fafc";
  const headerBg = "#064e3b";
  const border = "#dbe4ee";

  const renderTableHeader = (
    startX: number,
    y: number,
    tableWidth: number,
    colWidth: number,
    headers: string[],
    headerHeight: number,
  ) => {
    doc.rect(startX, y, tableWidth, headerHeight).fill(headerBg);
    headers.forEach((header, i) => {
      doc
        .fontSize(8)
        .fillColor("#ffffff")
        .text(header, startX + i * colWidth + 8, y + 7, {
          width: colWidth - 16,
        });
    });
  };

  for (const section of sections) {
    switch (section.type) {
      case "title":
        doc.fontSize(22).fillColor(green).text(section.text, { align: "left" });
        doc.moveDown(0.3);
        break;

      case "subtitle":
        doc.moveDown(0.8);
        doc.fontSize(12).fillColor(green).text(section.text);
        doc
          .moveTo(doc.x, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .strokeColor(green)
          .lineWidth(1.5)
          .stroke();
        doc.moveDown(0.5);
        break;

      case "cards": {
        const gap = 10;
        const startX = doc.x;
        const maxX = doc.page.width - doc.page.margins.right;
        const availableWidth = maxX - startX;
        const columns = Math.max(
          1,
          Math.min(section.columns ?? (section.items.length <= 4 ? section.items.length : 3), 3),
        );
        const cardWidth =
          (availableWidth - gap * Math.max(columns - 1, 0)) / columns;
        const minCardHeight = 56;
        const labelTop = 8;
        const valueTop = 26;
        const cardPadding = 10;
        let x = startX;
        let y = doc.y;
        let currentColumn = 0;
        let currentRowHeight = minCardHeight;

        for (const item of section.items) {
          const value = String(item.value);
          doc.fontSize(14);
          const valueHeight = doc.heightOfString(value, {
            width: cardWidth - cardPadding * 2,
            align: "left",
          });
          const cardHeight = Math.max(minCardHeight, valueTop + valueHeight + 8);

          if (currentColumn === columns) {
            x = startX;
            y += currentRowHeight + gap;
            currentColumn = 0;
            currentRowHeight = minCardHeight;
          }

          doc
            .roundedRect(x, y, cardWidth, cardHeight, 4)
            .fillAndStroke(lightBg, border);
          doc
            .fontSize(7.5)
            .fillColor(muted)
            .text(item.label, x + cardPadding, y + labelTop, {
              width: cardWidth - cardPadding * 2,
            });
          doc
            .fontSize(14)
            .fillColor(dark)
            .text(value, x + cardPadding, y + valueTop, {
              width: cardWidth - cardPadding * 2,
            });

          currentRowHeight = Math.max(currentRowHeight, cardHeight);
          x += cardWidth + gap;
          currentColumn += 1;
        }

        doc.y = y + currentRowHeight + 10;
        doc.x = startX;
        break;
      }

      case "table": {
        const tableWidth =
          doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const colCount = section.headers.length;
        const colWidth = tableWidth / colCount;
        const startX = doc.x;
        const headerHeight = 24;
        const cellPaddingX = 8;
        const cellPaddingY = 6;

        const needsNewPage =
          doc.y + headerHeight + 48 > doc.page.height - doc.page.margins.bottom;
        if (needsNewPage) doc.addPage();

        let y = doc.y;

        renderTableHeader(
          startX,
          y,
          tableWidth,
          colWidth,
          section.headers,
          headerHeight,
        );
        y += headerHeight;

        section.rows.forEach((row, rowIdx) => {
          const rowHeight = Math.max(
            22,
            ...row.map((cell) => {
              doc.fontSize(8.5);
              return (
                doc.heightOfString(String(cell), {
                  width: colWidth - cellPaddingX * 2,
                }) +
                cellPaddingY * 2
              );
            }),
          );

          if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            y = doc.y;
            renderTableHeader(
              startX,
              y,
              tableWidth,
              colWidth,
              section.headers,
              headerHeight,
            );
            y += headerHeight;
          }

          if (rowIdx % 2 === 1) {
            doc.rect(startX, y, tableWidth, rowHeight).fill(lighterBg);
          }

          row.forEach((cell, i) => {
            doc
              .fontSize(8.5)
              .fillColor(dark)
              .text(String(cell), startX + i * colWidth + cellPaddingX, y + cellPaddingY, {
                width: colWidth - cellPaddingX * 2,
              });
          });
          y += rowHeight;
        });

        doc.y = y + 5;
        doc.x = startX;
        break;
      }

      case "text":
        doc.fontSize(9).fillColor(muted).text(section.text);
        doc.moveDown(0.3);
        break;
    }
  }

  doc.moveDown(2);
  doc
    .fontSize(7)
    .fillColor(muted)
    .text(
      `Dokumen ini dibuat otomatis oleh TahfidzFlow pada ${new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      })}`,
      { align: "center" },
    );
}

export function createPdfStreamResponse(
  title: string,
  sections: PdfSection[],
  filename: string,
) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 40, left: 45, right: 45 },
    info: {
      Title: title,
      Creator: "TahfidzFlow",
    },
  });
  const stream = new PassThrough();

  doc.on("error", (error) => {
    stream.destroy(error);
  });
  doc.pipe(stream);

  try {
    renderPdfDocument(doc, sections);
    doc.end();
  } catch (error) {
    stream.destroy(error instanceof Error ? error : new Error(String(error)));
  }

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
