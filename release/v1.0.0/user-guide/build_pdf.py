#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build print-ready A4 PDF from the TahfidzFlow Teacher Guide Markdown.

Pipeline:  Markdown --(hand parser)--> HTML + A4 print CSS --(Chrome headless)--> vector PDF

Features:
  - Embedded system fonts (Charis/Georgia for body, sans for headings)
  - Clickable, auto-paginated Table of Contents (anchor IDs)
  - Running header + page numbers via @page CSS counters
  - Screenshots sized to full content width (landscape ~2:1), never cropped
  - Orphan-heading control, keep-steps-together, clean section spacing
  - No external Python/JS dependencies beyond a Chromium-class browser
"""

import os
import re
import sys
import html
import subprocess
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
MD_PATH = os.path.join(HERE, "User Guide Guru.md")
HTML_PATH = os.path.join(HERE, "User Guide Guru.html")
PDF_PATH = os.path.join(HERE, "User Guide Guru.pdf")
ASSETS_DIR_NAME = "Assets"

# --------------------------------------------------------------------------
# 0. Cover page (presentation layer only; guide body stays frozen)
# --------------------------------------------------------------------------
# Official TahfidzFlow brand mark: emerald-900 (#064e3b) rounded square with
# a white open-book glyph, matching the application's Sidebar/icon.svg. Rendered
# as inline SVG so it stays razor-sharp at any size and embeds with zero assets.
COVER_HTML = """<section class="cover">
  <div class="cover-inner">
    <div class="cover-logo">
      <svg viewBox="0 0 512 512" width="120" height="120" role="img" aria-label="TahfidzFlow">
        <rect width="512" height="512" rx="112" fill="#064e3b"/>
        <g fill="none" stroke="#ffffff" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">
          <path d="M256 150 C 200 120 130 120 90 138 L 90 388 C 130 370 200 370 256 400"/>
          <path d="M256 150 C 312 120 382 120 422 138 L 422 388 C 382 370 312 370 256 400"/>
          <line x1="256" y1="150" x2="256" y2="400"/>
        </g>
      </svg>
    </div>
    <p class="cover-kicker">Panduan Guru</p>
    <h1 class="cover-title">TahfidzFlow</h1>
    <p class="cover-sub">Sistem Manajemen Pembelajaran Tahfidz</p>
    <div class="cover-rule"></div>
    <p class="cover-version">Versi 1.0</p>
    <p class="cover-date">Juli 2026</p>
  </div>
</section>"""

# --------------------------------------------------------------------------
# 1. Lightweight Markdown parser  (handles the subset used by this guide)
# --------------------------------------------------------------------------

INLINE_BOLD = re.compile(r"\*\*(.+?)\*\*")
INLINE_ITALIC = re.compile(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)")

def inline(text):
    """Convert inline markdown (bold/italic/code) to HTML, escaping first."""
    text = html.escape(text)
    # inline code first to protect its content
    codes = []
    def stash_code(m):
        codes.append(m.group(1))
        return f"\x00CODE{len(codes)-1}\x00"
    text = re.sub(r"`([^`]+)`", stash_code, text)
    text = INLINE_BOLD.sub(r"<strong>\1</strong>", text)
    text = INLINE_ITALIC.sub(r"<em>\1</em>", text)
    # restore code
    for i, c in enumerate(codes):
        text = text.replace(f"\x00CODE{i}\x00", f"<code>{c}</code>")
    return text

def slugify(text):
    """Make a URL-safe anchor id from heading text (strip markdown/HTML)."""
    clean = re.sub(r"\*\*|\*|`", "", text)
    clean = html.unescape(clean)
    clean = re.sub(r"[^\w\s-]", "", clean).strip().lower()
    clean = re.sub(r"[\s_-]+", "-", clean)
    return clean or "section"

def parse(md_text):
    """Return (head, body_html). head = metadata, body_html = rendered chapters."""
    lines = md_text.splitlines()

    # ---- split off front matter (everything before first '## Bab' or '## Glosarium')
    # We keep front matter sections (title, info table, TOC) and all chapters together.

    out = []          # finished HTML blocks
    i = 0
    n = len(lines)
    toc_entries = []  # (level, text, anchor) for the auto TOC at top

    # Track first H1 (document title) for special cover treatment
    title_rendered = False

    while i < n:
        line = lines[i]
        stripped = line.rstrip()

        # blank
        if not stripped.strip():
            out.append("")
            i += 1
            continue

        # horizontal rule
        if stripped == "---":
            out.append('<hr class="section-rule"/>')
            i += 1
            continue

        # headings
        m = re.match(r"^(#{1,4})\s+(.*)$", stripped)
        if m:
            level = len(m.group(1))
            text_raw = m.group(2).strip()
            anchor = slugify(text_raw)
            # Document title -> cover.
            # The guide body is frozen; the cover is rendered entirely in the
            # presentation layer with the official TahfidzFlow brand mark and
            # the exact requested display text. We consume (skip) the Markdown
            # H1 and its metadata block without altering the source file.
            if level == 1 and not title_rendered:
                title_rendered = True
                i += 1
                # consume the cover metadata block in the Markdown until the
                # first '---' separator (the body content itself is untouched)
                while i < n and lines[i].strip() != "---" and not re.match(r"^#{2,4}\s", lines[i]):
                    i += 1
                if i < n and lines[i].strip() == "---":
                    i += 1
                out.append(COVER_HTML)
                continue
            # Normal heading
            tag = f"h{level}"
            cls = ""
            # Chapter-level (##) headings get a page break before (except first)
            if level == 2:
                cls = ' class="chapter"'
                toc_entries.append((1, strip_md(text_raw), anchor))
            elif level == 3:
                toc_entries.append((2, strip_md(text_raw), anchor))
            out.append(f'<{tag}{(" id=\""+anchor+"\"") if anchor else ""}{cls}><a class="anchor" href="#{anchor}"></a>{inline(text_raw)}</{tag}>')
            i += 1
            continue

        # image
        m = re.match(r"^!\[(.*?)\]\((.+?)\)\s*$", stripped)
        if m:
            alt = m.group(1)
            src = m.group(2)
            out.append(f'<figure class="screenshot"><img src="{src}" alt="{html.escape(alt)}"/><figcaption>{inline(alt)}</figcaption></figure>')
            i += 1
            continue

        # table
        if stripped.startswith("|") and i + 1 < n and re.match(r"^\|[\s:|-]+\|\s*$", lines[i+1].strip()):
            # gather table
            tbl = [stripped]
            i += 1
            tbl.append(lines[i])  # separator
            i += 1
            while i < n and lines[i].strip().startswith("|"):
                tbl.append(lines[i])
                i += 1
            out.append(render_table(tbl))
            continue

        # blockquote
        if stripped.startswith(">"):
            bq = []
            while i < n and lines[i].lstrip().startswith(">"):
                bq.append(re.sub(r"^\s*>\s?", "", lines[i]))
                i += 1
            out.append(f'<blockquote>{inline(" ".join(b.strip() for b in bq))}</blockquote>')
            continue

        # numbered list
        if re.match(r"^\d+\.\s", stripped):
            items = []
            while i < n and re.match(r"^\s*\d+\.\s", lines[i]):
                raw, indent = parse_list_item(lines[i])
                # gather continuation/sub-bullets
                i += 1
                sub = []
                while i < n and re.match(r"^\s{3,}[-*]\s", lines[i]):
                    sraw, _ = parse_list_item(re.sub(r"^\s+", "", lines[i]))
                    sub.append(sraw)
                    i += 1
                items.append((raw, sub))
            buf = ['<ol class="steps">']
            for raw, sub in items:
                buf.append(f'<li>{inline(raw)}')
                if sub:
                    buf.append('<ul class="sub">')
                    for s in sub:
                        buf.append(f'<li>{inline(s)}</li>')
                    buf.append('</ul>')
                buf.append('</li>')
            buf.append('</ol>')
            out.append("".join(buf))
            continue

        # bulleted list
        if re.match(r"^\s*[-*]\s", stripped):
            items = []
            while i < n and re.match(r"^\s*[-*]\s", lines[i]):
                raw, _ = parse_list_item(lines[i])
                items.append(raw)
                i += 1
            buf = ['<ul class="bullets">']
            for it in items:
                buf.append(f'<li>{inline(it)}</li>')
            buf.append('</ul>')
            out.append("".join(buf))
            continue

        # labeled paragraph like "**Tujuan**" on its own line
        if re.match(r"^\*\*.+\*\*\s*$", stripped):
            out.append(f'<p class="label">{inline(stripped)}</p>')
            i += 1
            continue

        # normal paragraph (gather consecutive non-empty, non-special lines)
        para = [stripped]
        i += 1
        while i < n:
            nxt = lines[i].rstrip()
            if (not nxt.strip() or nxt == "---" or re.match(r"^#{1,4}\s", nxt)
                    or re.match(r"^\d+\.\s", nxt) or re.match(r"^\s*[-*]\s", nxt)
                    or nxt.startswith("|") or nxt.startswith(">") or nxt.startswith("!")
                    or re.match(r"^\*\*.+\*\*\s*$", nxt)):
                break
            para.append(nxt)
            i += 1
        joined = " ".join(p.strip() for p in para)
        # completion sentences are italic-only paragraphs -> style them
        if joined.startswith("*") and joined.endswith("*") and joined.count("*") == 2:
            inner = joined[1:-1]
            out.append(f'<p class="completion">{inline(inner)}</p>')
        else:
            out.append(f'<p>{inline(joined)}</p>')

    return out, toc_entries

def strip_md(text):
    t = re.sub(r"\*\*|\*|`", "", text)
    return html.unescape(t).strip()

def parse_list_item(line):
    m = re.match(r"^(\s*)\d+\.\s+(.*)$", line) or re.match(r"^(\s*)[-*]\s+(.*)$", line)
    if m:
        return m.group(2).strip(), len(m.group(1))
    return line.strip(), 0

def render_table(tbl_lines):
    rows = []
    for ln in tbl_lines:
        ln = ln.strip()
        if re.match(r"^\|[\s:|-]+\|\s*$", ln):
            continue
        cells = [c.strip() for c in ln.strip("|").split("|")]
        rows.append(cells)
    if not rows:
        return ""
    out = ['<table>']
    # header
    out.append('<thead><tr>' + "".join(f'<th>{inline(c)}</th>' for c in rows[0]) + '</tr></thead>')
    out.append('<tbody>')
    for r in rows[1:]:
        out.append('<tr>' + "".join(f'<td>{inline(c)}</td>' for c in r) + '</tr>')
    out.append('</tbody></table>')
    return "".join(out)

# --------------------------------------------------------------------------
# 2. A4 print CSS
# --------------------------------------------------------------------------

CSS = r"""
@page {
    size: A4 portrait;
    margin: 20mm 18mm 18mm 18mm;
    @top-center {
        content: "Panduan Guru TahfidzFlow";
        font-family: "Segoe UI", Tahoma, sans-serif;
        font-size: 8pt;
        color: #9aa0a6;
    }
    @bottom-center {
        content: "Halaman " counter(page) " dari " counter(pages);
        font-family: "Segoe UI", Tahoma, sans-serif;
        font-size: 8pt;
        color: #9aa0a6;
    }
}
@page :first {
    margin: 0;
    @top-center { content: ""; }
    @bottom-center { content: ""; }
}

html { font-size: 10.5pt; }

body {
    font-family: Georgia, "Times New Roman", "Charis SIL", serif;
    color: #1f2933;
    line-height: 1.6;
    margin: 0;
    hyphens: auto;
}

/* ---------- Cover ---------- */
/* Chromium's print engine ignores text-align:center on blocks. The only
   reliable centering method is absolute positioning with left:50% +
   translateX(-50%). Each element is absolutely placed on the A4 page. */
.cover {
    page-break-after: always;
    position: relative;
    width: 210mm;
    height: 297mm;
    margin: 0;
    padding: 0;
    background: #ffffff;
}
.cover-inner { }
.cover .cover-logo,
.cover .cover-kicker,
.cover .cover-title,
.cover .cover-sub,
.cover .cover-rule,
.cover .cover-version,
.cover .cover-date {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    margin: 0;
}
/* Vertical placement on the 297mm page (logo ~ middle-upper, text flowing down) */
.cover .cover-logo   { top: 88mm;  }
.cover .cover-kicker { top: 122mm; }
.cover .cover-title  { top: 132mm; }
.cover .cover-sub    { top: 168mm; }
.cover .cover-rule   { top: 192mm; }
.cover .cover-version{ top: 204mm; }
.cover .cover-date   { top: 214mm; }

.cover-logo svg {
    display: block;
    margin: 0 auto;
}
.cover-kicker {
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-size: 14pt;
    font-weight: 600;
    color: #0f6e4f;
    letter-spacing: 4pt;
    text-transform: uppercase;
}
.cover-title {
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-size: 40pt;
    font-weight: 800;
    color: #064e3b;
    line-height: 1.1;
    letter-spacing: -0.5px;
    white-space: nowrap;
}
.cover-sub {
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-size: 13pt;
    font-weight: 400;
    color: #52606d;
}
.cover-rule {
    display: block;
    width: 40mm;
    height: 2pt;
    background: #0f6e4f;
    border: none;
}
.cover-version {
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-size: 12pt;
    font-weight: 700;
    color: #1f2933;
}
.cover-date {
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-size: 11pt;
    font-weight: 400;
    color: #52606d;
}

/* ---------- Headings ---------- */
h2.chapter {
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-size: 19pt;
    font-weight: 700;
    color: #0f6e4f;
    margin: 0 0 4mm 0;
    padding-bottom: 2mm;
    border-bottom: 2pt solid #0f6e4f;
    page-break-before: always;
    page-break-after: avoid;
}
h3 {
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-size: 13.5pt;
    font-weight: 700;
    color: #145a43;
    margin: 7mm 0 2mm 0;
    page-break-after: avoid;
}
h2:not(.chapter) {
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-size: 16pt;
    font-weight: 700;
    color: #0f6e4f;
    margin: 0 0 3mm 0;
    padding-bottom: 1.5mm;
    border-bottom: 1.5pt solid #0f6e4f;
    page-break-before: always;
    page-break-after: avoid;
}
.anchor { display: block; }

/* ---------- Labeled blocks (Tujuan, Tampilan, ...) ---------- */
p.label {
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-weight: 700;
    color: #0f6e4f;
    margin: 4mm 0 1mm 0;
    page-break-after: avoid;
}

/* ---------- Body text ---------- */
p { margin: 0 0 2.5mm 0; text-align: justify; }
p.completion {
    font-style: italic;
    color: #52606d;
    margin-top: 3mm;
    padding-left: 3mm;
    border-left: 2pt solid #c8e6d6;
    text-align: left;
}

/* ---------- Lists ---------- */
ol.steps { margin: 1mm 0 3mm 0; padding-left: 7mm; }
ol.steps > li { margin: 0 0 1.5mm 0; text-align: justify; }
ol.steps > li::marker { font-weight: 700; color: #0f6e4f; }
ul.sub { margin: 1.5mm 0 1mm 0; padding-left: 6mm; list-style: disc; }
ul.sub li { margin: 0 0 1mm 0; }
ul.bullets { margin: 1mm 0 3mm 0; padding-left: 7mm; list-style: disc; }
ul.bullets li { margin: 0 0 1.5mm 0; text-align: justify; }

/* ---------- Screenshots ---------- */
/* The "Tampilan" label and its screenshot are wrapped together so they never
   split across a page break (which previously produced a page with only the
   label or only the heading). */
.tampilan-block {
    page-break-inside: avoid;
    break-inside: avoid;
    margin: 2mm 0 3mm 0;
}
.tampilan-block p.label {
    margin: 2mm 0 1mm 0;
}
figure.screenshot {
    margin: 2mm 0 3mm 0;
    text-align: center;
    page-break-inside: avoid;
}
figure.screenshot img {
    width: auto;
    max-width: 174mm;          /* full content width on A4 with 18mm margins */
    /* Constrain height so a label+figure pair always fits with room for the
       label and caption on the same page. ~245mm keeps tall portrait shots
       on one page without cropping (height:auto preserves aspect ratio). */
    max-height: 245mm;
    height: auto;
    border: 1pt solid #d9dde2;
    border-radius: 3pt;
}
figure.screenshot figcaption {
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-size: 8.5pt;
    color: #7b8794;
    margin-top: 1.5mm;
    font-style: italic;
}

/* ---------- Tables ---------- */
table {
    border-collapse: collapse;
    width: 100%;
    margin: 2mm 0 4mm 0;
    font-size: 9.5pt;
    page-break-inside: auto;
}
th, td {
    border: 0.5pt solid #cdd2d8;
    padding: 2mm 3mm;
    text-align: left;
    vertical-align: top;
}
thead th {
    background: #0f6e4f;
    color: #ffffff;
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-weight: 700;
}
tbody tr:nth-child(even) { background: #f3f7f5; }

/* ---------- Blockquote ---------- */
blockquote {
    margin: 2mm 0;
    padding: 2.5mm 4mm;
    background: #f3f7f5;
    border-left: 3pt solid #0f6e4f;
    color: #3e4c59;
    font-style: italic;
}

/* ---------- Horizontal rule ---------- */
hr.section-rule {
    border: none;
    border-top: 0.5pt solid #d9dde2;
    margin: 5mm 0;
}

/* ---------- Table of Contents ---------- */
.toc {
    page-break-after: always;
}
.toc h2 {
    page-break-before: avoid;
}
.toc ol { list-style: none; padding-left: 0; margin: 4mm 0; }
.toc .toc-l1 {
    font-family: "Segoe UI", Tahoma, sans-serif;
    font-weight: 700;
    color: #1f2933;
    font-size: 10.5pt;
    margin: 2.2mm 0 0.5mm 0;
}
.toc .toc-l2 {
    font-family: Georgia, serif;
    font-weight: 400;
    color: #52606d;
    font-size: 10pt;
    margin: 0.8mm 0 0.8mm 6mm;
}
/* Clickable entry + page number. The <a> is a flex row: title on the left,
   dotted leader filling the middle, page number on the right. Chromium does
   NOT support CSS target-counter, so page numbers are injected as real text
   via a two-pass render and styled here. */
.toc li a {
    text-decoration: none;
    color: inherit;
    display: flex;
    align-items: baseline;
    text-align: left;
}
.toc li a .toc-title {
    flex: 0 1 auto;
}
/* Dotted leader between title and page number */
.toc li a .toc-title::after {
    content: "";
    display: inline-block;
    width: 100%;
    border-bottom: 0.5pt dotted #b9c1cc;
    margin: 0 1.5mm;
    transform: translateY(-3px);
}
.toc li a .toc-page {
    flex: 0 0 auto;
    font-variant-numeric: tabular-nums;
    min-width: 7mm;
    text-align: right;
}
/* When no page number is injected (first render pass), hide the empty leader */
.toc li a:not(:has(.toc-page)) .toc-title::after {
    content: none;
}
.toc .dot {
    border-bottom: 0.5pt dotted #b9c1cc;
    margin: 0 1.5mm;
}

/* avoid orphan headings at page bottom */
h2, h3, p.label { widows: 2; orphans: 2; }
"""

# --------------------------------------------------------------------------
# 3. Assemble full HTML document
# --------------------------------------------------------------------------

def build_html(md_text, anchor_pages=None):
    body_blocks, toc_entries = parse(md_text)

    # Build clickable TOC (replaces the manual placeholder TOC in the markdown)
    # anchor_pages: dict anchor -> page number (filled in on the second render
    # pass). When present, a page-number with dotted leader is shown per entry.
    toc_html = ['<section class="toc"><h2 id="daftar-isi">Daftar Isi</h2><ol>']
    for level, text, anchor in toc_entries:
        cls = f"toc-l{level}"
        pageno = ""
        if anchor_pages and anchor in anchor_pages:
            pageno = f'<span class="toc-page">{anchor_pages[anchor]}</span>'
        toc_html.append(
            f'<li class="{cls}"><a href="#{anchor}"><span class="toc-title">{html.escape(text)}</span>{pageno}</a></li>'
        )
    toc_html.append('</ol></section>')

    # The markdown already contains a manual "## Daftar Isi" section with a placeholder.
    # Replace everything between the TOC heading and the next chapter with our auto-TOC.
    full = "\n".join(body_blocks)

    # Replace the manual TOC block (from its heading to the rule before Bab 1)
    pattern = re.compile(
        r'<h2[^>]*id="daftar-isi"[^>]*>.*?(?=<h2[^>]*class="chapter")',
        re.DOTALL,
    )
    full = pattern.sub("\n".join(toc_html) + "\n", full, count=1)

    # Wrap each "Tampilan" label together with its screenshot figure in a
    # keep-together container so the heading and image never split across
    # pages (which previously left the label orphaned on its own page).
    full = re.sub(
        r'<p class="label"><strong>Tampilan</strong></p>\s*(<figure class="screenshot">.*?</figure>)',
        r'<div class="tampilan-block">\n<p class="label"><strong>Tampilan</strong></p>\n\1\n</div>',
        full,
        flags=re.DOTALL,
    )

    doc = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<title>Panduan Guru TahfidzFlow</title>
<style>
{CSS}
</style>
</head>
<body>
{full}
</body>
</html>
"""
    return doc

# --------------------------------------------------------------------------
# 4. Render to PDF with headless Chrome/Edge
# --------------------------------------------------------------------------

def find_browser():
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return shutil.which("chrome") or shutil.which("msedge")

def render_pdf(html_path, pdf_path):
    browser = find_browser()
    if not browser:
        sys.exit("ERROR: No Chrome/Edge browser found for PDF rendering.")
    file_url = "file:///" + html_path.replace("\\", "/")
    cmd = [
        browser,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--no-sandbox",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=10000",
        f"--print-to-pdf={pdf_path}",
        file_url,
    ]
    print(f"[build] rendering PDF with: {os.path.basename(browser)}")
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if res.returncode != 0 and not os.path.exists(pdf_path):
        print(res.stdout)
        print(res.stderr)
        sys.exit("ERROR: PDF rendering failed.")
    return browser

# --------------------------------------------------------------------------
# 4b. Extract anchor -> page-number mapping from a rendered PDF
# --------------------------------------------------------------------------
# Chromium does not support CSS target-counter(), so TOC page numbers cannot
# be produced in a single pass. Instead: render once (pass 1), read the PDF's
# structure to learn which physical page each named destination lands on, then
# render again (pass 2) with those numbers injected as real text.

def _parse_xref_offsets(data):
    """Return {obj_num: byte_offset} for all indirect objects."""
    xref = {}
    for m in re.finditer(rb"(\d+)\s+(\d+)\s+obj", data):
        xref[int(m.group(1))] = m.start()
    return xref

def _kids_to_pages(data, xref):
    """Resolve the /Pages tree into an ordered list of page object numbers."""
    # Find the /Pages root reference
    root_m = re.search(rb"/Pages\s+(\d+)\s+0\s+R", data)
    if not root_m:
        return []
    def obj_text(num):
        off = xref.get(num)
        if off is None:
            return b""
        end = data.find(b"endobj", off)
        return data[off:end]
    def walk(num):
        txt = obj_text(num)
        kids = re.findall(rb"/Kids\s*\[(.*?)\]", txt, re.DOTALL)
        result = []
        if kids:
            for kid_ref in re.findall(rb"(\d+)\s+0\s+R", kids[0]):
                result.extend(walk(int(kid_ref)))
        else:
            # leaf page
            if b"/Page" in txt or b"/MediaBox" in txt:
                result.append(num)
        return result
    return walk(int(root_m.group(1)))

def extract_anchor_pages(pdf_path, toc_anchors):
    """Map each anchor name -> 1-based page number, using the PDF's named
    destination dictionary. Returns {} if parsing fails (TOC will just have
    no numbers, links still work).

    Chrome writes the /Dests as a FLAT dictionary on a single object:
        <</anchor-name [pageObj 0 R /XYZ x y z]  /next-name [...] ...>>
    rather than a nested /Names Kids tree. So we parse that flat dict and
    resolve each page-object reference to a physical page index.
    """
    if not toc_anchors:
        return {}
    anchors_set = set(toc_anchors)
    with open(pdf_path, "rb") as f:
        data = f.read()

    xref = _parse_xref_offsets(data)
    page_objs = _kids_to_pages(data, xref)  # ordered; index+1 = page number
    page_obj_to_num = {obj: i + 1 for i, obj in enumerate(page_objs)}

    anchor_pages = {}

    # Locate the /Dests dictionary referenced from the Catalog.
    catalog_m = re.search(rb"/Dests\s+(\d+)\s+0\s+R", data)
    if not catalog_m:
        return {}
    dests_obj = int(catalog_m.group(1))
    off = xref.get(dests_obj)
    if off is None:
        return {}
    end = data.find(b">>", off)  # first closing of the dict
    # The dict may contain nested '>>' inside values, so find the matching
    # close by scanning. Simpler: take up to 'endobj'.
    end = data.find(b"endobj", off)
    dests_txt = data[off:end]

    # Each entry: /name [ pageObjRef /XYZ x y z ]
    # Capture name and the first "n 0 R" page-object reference inside its array.
    for m in re.finditer(
        rb"/([A-Za-z0-9\-_.]+)\s*\[\s*(\d+)\s+0\s+R",
        dests_txt,
    ):
        name = m.group(1).decode("latin1")
        if name in anchors_set:
            page_obj = int(m.group(2))
            if page_obj in page_obj_to_num:
                anchor_pages[name] = page_obj_to_num[page_obj]

    return anchor_pages

# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------

def main():
    if not os.path.exists(MD_PATH):
        sys.exit(f"ERROR: {MD_PATH} not found")
    with open(MD_PATH, "r", encoding="utf-8") as f:
        md_text = f.read()

    print(f"[build] parsing markdown ({len(md_text)} chars)")

    # We need the list of TOC anchors to look up their page numbers.
    _, toc_entries = parse(md_text)
    toc_anchors = [a for _, _, a in toc_entries]

    # --- Convergence loop ---
    # Adding TOC page numbers can itself shift body pagination, so we render,
    # extract, re-render, and repeat until the page numbers stabilize. In
    # practice this converges in 2-3 passes because the TOC's own height is
    # fixed once page numbers (constant width) are present.
    anchor_pages = {}
    pass_pdf = PDF_PATH + ".pass.pdf"
    MAX_PASSES = 5
    for attempt in range(1, MAX_PASSES + 1):
        html_doc = build_html(md_text, anchor_pages=anchor_pages)
        with open(HTML_PATH, "w", encoding="utf-8") as f:
            f.write(html_doc)
        print(f"[build] pass {attempt}: rendering")
        render_pdf(HTML_PATH, pass_pdf)
        new_pages = extract_anchor_pages(pass_pdf, toc_anchors)
        resolved = len(new_pages)
        changed = sum(1 for k in new_pages if anchor_pages.get(k) != new_pages[k])
        print(f"[build]   resolved {resolved}/{len(toc_anchors)}, changed since last pass: {changed}")
        anchor_pages = new_pages
        if changed == 0 and resolved == len(toc_anchors):
            print(f"[build] pagination stable after pass {attempt}")
            break
    else:
        print(f"[build] WARNING: pagination did not fully stabilize in {MAX_PASSES} passes")

    try:
        os.remove(pass_pdf)
    except OSError:
        pass

    # Final HTML already written; copy pass PDF to final.
    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(html_doc)
    render_pdf(HTML_PATH, PDF_PATH)
    if os.path.exists(PDF_PATH):
        size_kb = os.path.getsize(PDF_PATH) // 1024
        print(f"[build] PDF written: {PDF_PATH} ({size_kb} KB)")
    else:
        sys.exit("ERROR: PDF was not created.")

if __name__ == "__main__":
    main()
