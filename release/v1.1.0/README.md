# TahfidzFlow — Release v1.1.0

**Release date:** 14 July 2026  
**Application:** TahfidzFlow  
**Release type:** Minor production release

This folder is the release package for **TahfidzFlow v1.1.0**. It contains the
release notes and changelog, current engineering and QA references, branding
assets, the Teacher User Guide, the stakeholder presentation, and a lightweight
deployment source reference. The full application source remains in `web/`.

Read `RELEASE_NOTES.md` first for release highlights and deployment notes,
`CHANGELOG.md` for the detailed implementation history, and `MANIFEST.md` for
the complete file list and checksums.

## Folder structure

```text
release/v1.1.0/
├── README.md
├── CHANGELOG.md
├── RELEASE_NOTES.md
├── MANIFEST.md
├── documentation/
├── assets/
│   ├── manifest.json
│   └── icons/
├── user-guide/
├── presentation/
└── source-reference/
```

## Package contents

### `documentation/`

Current deployment, rollback, PWA, QA, persistence, workflow-audit, and project
reference documents copied from the repository at packaging time:

- `README.md` and `AI_CONTEXT.md`
- `DEPLOYMENT.md`, `ROLLBACK.md`, and `RELEASE_CHECKLIST.md`
- `KNOWN_ISSUES.md`, `TEST_RESULTS.md`, `UAT_CHECKLIST.md`, and
  `MANUAL_TEST_CHECKLIST.md`
- `PWA_READINESS_REPORT.md` and `PWA_BUGS.md`
- `PERSISTENCE_ARCHITECTURE.md`, `WORKFLOW_PERSISTENCE_AUDIT.md`, and
  `WORKFLOW_PERSISTENCE_PHASE_3B_AUDIT.md`
- `PRESENTATION_QA.md` and `ui-ux-speed-improvements-plan.md`

### `assets/`

The current Web App Manifest and TahfidzFlow icon set used by the application.

### `user-guide/`

The **Panduan Guru TahfidzFlow v1.1**, supplied as editable Markdown, styled
HTML, and a print-ready 52-page A4 PDF. The package also includes its build
script and 25 referenced screenshots.

### `presentation/`

The stakeholder PowerPoint presentation (`Tahfidz Flow .pptx`).

### `source-reference/`

Deployment configuration snapshots, not the full application source:

- `.env.example`
- `vercel.json`
- `package.monorepo.json`
- `package.web.json`

## Application verification

Run from the repository root:

```bash
npm --prefix web run verify
```

The combined gate runs unit/regression tests, lint, typecheck, and the production
build. It is designed to run in release/CI environments without a local `.env`;
production deployment still requires the environment variables documented in
`documentation/DEPLOYMENT.md` and `source-reference/.env.example`.

## Integrity

`MANIFEST.md` lists every packaged file with its byte size and the first 16
characters of its SHA-256 checksum. The manifest intentionally excludes its own
checksum so it can be regenerated deterministically.

## Historical release

`release/v1.0.0/` remains the immutable General Availability snapshot. No file
in that folder is replaced by this package.

## Out of scope

- Full application source code
- Offline mutation queue or background synchronization
- Admin CRUD for Release Notes (planned separately)
