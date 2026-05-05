import puppeteer, { type Browser } from "puppeteer";

let _browser: Browser | null = null;

export async function getBrowser() {
  if (!_browser) {
    _browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return _browser;
}

export async function generatePdf(htmlContent: string, title: string) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; padding: 40px; font-size: 13px; line-height: 1.5; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 16px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; color: #064e3b; border-bottom: 2px solid #064e3b; padding-bottom: 6px; }
    h3 { font-size: 14px; font-weight: 600; margin-top: 16px; margin-bottom: 8px; }
    .subtitle { font-size: 12px; color: #64748b; margin-bottom: 20px; }
    .meta { display: flex; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
    .meta-item { }
    .meta-label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; }
    .meta-value { font-size: 14px; font-weight: 600; }
    .cards { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; min-width: 120px; }
    .card-label { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
    .card-value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    .card-value.green { color: #064e3b; }
    .card-value.amber { color: #b45309; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th { background: #064e3b; color: white; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 11px; }
    td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
    tr:nth-child(even) td { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
    .badge-green { background: #ecfdf5; color: #064e3b; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-blue { background: #eff6ff; color: #1e40af; }
    .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @page { margin: 15mm; }
  </style>
</head>
<body>
${htmlContent}
<div class="footer">Dicetak dari TahfidzFlow pada ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
</body>
</html>`;

  await page.setContent(fullHtml, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" },
  });
  await page.close();
  return pdfBuffer;
}
