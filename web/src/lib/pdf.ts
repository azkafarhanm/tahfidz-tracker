import PDFDocument from "pdfkit";

type PdfSection =
  | { type: "title"; text: string }
  | { type: "subtitle"; text: string }
  | { type: "cards"; items: { label: string; value: string | number }[] }
  | {
      type: "table";
      headers: string[];
      rows: (string | number)[][];
    }
  | { type: "text"; text: string };

export async function generatePdf(
  title: string,
  sections: PdfSection[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 45, right: 45 },
      info: {
        Title: title,
        Creator: "TahfidzFlow",
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const green = "#064e3b";
    const dark = "#0f172a";
    const muted = "#64748b";
    const lightBg = "#f1f5f9";
    const headerBg = "#064e3b";

    for (const section of sections) {
      switch (section.type) {
        case "title":
          doc.fontSize(20).fillColor(green).text(section.text, { align: "left" });
          doc.moveDown(0.3);
          break;

        case "subtitle":
          doc.moveDown(0.8);
          doc.fontSize(11).fillColor(green).text(section.text);
          doc
            .moveTo(doc.x, doc.y)
            .lineTo(doc.page.width - doc.page.margins.right, doc.y)
            .strokeColor(green)
            .lineWidth(1.5)
            .stroke();
          doc.moveDown(0.5);
          break;

        case "cards": {
          const cardWidth = 110;
          const cardHeight = 45;
          const gap = 10;
          const startX = doc.x;
          let x = startX;
          const y = doc.y;

          for (const item of section.items) {
            if (x + cardWidth > doc.page.width - doc.page.margins.right) {
              x = startX;
            }

            doc
              .roundedRect(x, y, cardWidth, cardHeight, 4)
              .fillAndStroke(lightBg, "#e2e8f0");
            doc
              .fontSize(7)
              .fillColor(muted)
              .text(item.label, x + 8, y + 6, { width: cardWidth - 16 });
            doc
              .fontSize(16)
              .fillColor(dark)
              .text(String(item.value), x + 8, y + 20, {
                width: cardWidth - 16,
              });

            x += cardWidth + gap;
          }

          doc.y = y + cardHeight + 10;
          doc.x = startX;
          break;
        }

        case "table": {
          const tableWidth =
            doc.page.width - doc.page.margins.left - doc.page.margins.right;
          const colCount = section.headers.length;
          const colWidth = tableWidth / colCount;
          const startX = doc.x;
          const headerHeight = 22;
          const rowHeight = 20;

          const needsNewPage = doc.y + headerHeight + rowHeight * 2 > doc.page.height - doc.page.margins.bottom;
          if (needsNewPage) doc.addPage();

          let y = doc.y;

          doc
            .rect(startX, y, tableWidth, headerHeight)
            .fill(headerBg);
          section.headers.forEach((header, i) => {
            doc
              .fontSize(8)
              .fillColor("#ffffff")
              .text(header, startX + i * colWidth + 6, y + 6, {
                width: colWidth - 12,
                lineBreak: false,
              });
          });
          y += headerHeight;

          section.rows.forEach((row, rowIdx) => {
            if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
              doc.addPage();
              y = doc.y;
            }

            if (rowIdx % 2 === 1) {
              doc.rect(startX, y, tableWidth, rowHeight).fill(lightBg);
            }

            row.forEach((cell, i) => {
              doc
                .fontSize(8)
                .fillColor(dark)
                .text(String(cell), startX + i * colWidth + 6, y + 5, {
                  width: colWidth - 12,
                  lineBreak: false,
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
        `Dicetak dari TahfidzFlow pada ${new Date().toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}`,
        { align: "center" },
      );

    doc.end();
  });
}
