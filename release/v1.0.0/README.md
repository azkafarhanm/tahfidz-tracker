# TahfidzFlow — Release v1.0.0

**Release date:** 1 July 2026
**Application:** TahfidzFlow (name unchanged)
**Release type:** First production release (General Availability)

This folder is the **release package for TahfidzFlow v1.0.0**. It bundles the
hand-off documentation, branding assets, end-user guide, the presentation deck,
and a lightweight source reference. It does **not** contain the full application
source code — that lives in the repository's `web/` directory.

> Read **`RELEASE_NOTES.md`** first for what changed, and **`CHANGELOG.md`** for
> the detailed history. See **`MANIFEST.md`** for the full file listing with sizes
> and checksums.

---

## Folder structure

```
release/v1.0.0/
├── README.md              ← You are here. Explains every folder.
├── CHANGELOG.md           ← Detailed change history (Keep a Changelog format).
├── RELEASE_NOTES.md       ← Executive release notes, deploy steps, known limits.
├── MANIFEST.md            ← Full file listing with sizes and SHA-256 checksums.
│
├── documentation/         ← All engineering & QA documents.
├── assets/                ← Branding: Web App Manifest + icon set.
│   ├── manifest.json
│   └── icons/
├── user-guide/            ← End-user Teacher Guide (Markdown + PDF + HTML).
├── presentation/          ← Stakeholder presentation deck.
└── source-reference/      ← Config/env templates for deployment (not full source).
```

---

## What each folder contains

### 📄 `documentation/`
Engineering and QA reference documents copied from the repository `docs/` folder
and root. Use these to deploy, verify, roll back, and audit the release.

| File | Purpose |
|---|---|
| `README.md` | Project overview, features, architecture, tech stack (copied from repo root). |
| `AI_CONTEXT.md` | High-level context summary for the codebase. |
| `DEPLOYMENT.md` | Step-by-step Vercel deployment + environment variables. |
| `ROLLBACK.md` | Rollback procedure. |
| `RELEASE_CHECKLIST.md` | PWA release checklist + final release gate. |
| `PWA_READINESS_REPORT.md` | PWA readiness matrix and offline-behavior findings. |
| `PWA_BUGS.md` | Known PWA-specific bugs. |
| `KNOWN_ISSUES.md` | Current known issues (all P0s resolved at release). |
| `TEST_RESULTS.md` | UAT audit snapshot (point-in-time reference). |
| `UAT_CHECKLIST.md` | User-acceptance test checklist. |
| `MANUAL_TEST_CHECKLIST.md` | Manual QA test checklist. |
| `ui-ux-speed-improvements-plan.md` | Performance/UX improvement plan. |

### 🎨 `assets/`
Branding assets used by the application.

- `manifest.json` — Web App Manifest (name, theme color `#064e3b`, icons).
- `icons/` — the cleaned, minimalist icon set:
  - `icon.svg`, `favicon.svg` — vector source (scalable, crisp at any size).
  - `icon-192.png`, `icon-512.png` — PWA raster icons (manifest `any` + `maskable`).
  - `apple-touch-icon.png` — iOS Home Screen icon.

### 📕 `user-guide/`
The **Teacher User Guide** ("Panduan Guru TahfidzFlow"), ready for distribution.

- `User Guide Guru.pdf` — **print-ready 50-page A4 PDF** (primary deliverable).
- `User Guide Guru.md` — editable Markdown source.
- `User Guide Guru.html` — styled HTML (used to regenerate the PDF).
- `build_pdf.py` — the Markdown→PDF build script (run `python build_pdf.py`).
- `Assets/` — the 25 ordered application screenshots referenced by the guide.

### 🖥️ `presentation/`
Stakeholder presentation deck.

- `Tahfidz Flow .pptx` — PowerPoint slide deck.

### ⚙️ `source-reference/`
Deployment configuration templates. **Not the full source code** — just the
files needed to understand the deploy configuration.

- `.env.example` — environment variable template (copy to `.env` for local dev).
- `vercel.json` — Vercel deployment config.
- `package.monorepo.json` — root monorepo `package.json` (npm script wrappers).
- `package.web.json` — `web/package.json` (Next.js app dependencies + scripts:
  `lint`, `typecheck`, `build`, `verify`).

---

## How to verify the application

From the repository root (where the `web/` app lives):

```bash
npm --prefix web run lint        # ESLint
npm --prefix web run typecheck   # tsc --noEmit
npm --prefix web run build       # next build
# or the full gate:
npm --prefix web run verify
```

---

## Integrity

Every file in this package is listed in `MANIFEST.md` with its size and the
first 16 characters of its SHA-256 hash. Verify any file with:

```bash
sha256sum "<file>" | cut -c1-16
```

---

## Out of scope for this release

- **Full application source code** — lives in the repository's `web/` directory.
- **Offline mutation queue / background sync** — this is an online-first PWA;
  see `RELEASE_NOTES.md` → "Known limitations".
- **Pre-v1.0.0 release tags** — this is the first tagged release.
