# Changelog

All notable changes to **TahfidzFlow** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-07-01

### Summary

First production release of TahfidzFlow — a mobile-first Quran memorization
(hifz/tahfidz) tracking platform for Islamic schools. This release delivers the
complete teacher and admin workflows, the dual-program (Academic / Boarding)
architecture, exports, a trilingual interface (Indonesian / English / Arabic
with RTL), and an installable online-first PWA.

### Added — Teacher workflow

- **Dashboard** with daily statistics, weekly target progress, and recent
  activity feed (Hafalan, Murojaah, Tasmi').
- **Program-aware filtering** via ProgramSelector (Academic / Boarding),
  auto-detected for single-program teachers, switchable for dual-program teachers.
- **Student list** with search, pagination, latest-record summaries, Tasmi'
  badges, and "needs review" indicators.
- **Quick Log** — guided multi-step rapid record entry.
- **Hafalan & Murojaah** create / edit / delete with surah + ayah range input.
- **Tasmi' module** — per-juz records with grade and examiner.
- **Formative recap** generated automatically from daily records, per semester.
- **Flexible summative assessment** per student and per surah.
- **Targets** with active / cancel / complete lifecycle.
- **Student detail** view with history, targets, Tasmi' summary, and exports.
- **Teacher reports** with Excel and PDF export and context-aware back navigation.

### Added — Admin workflow

- Admin dashboard with system-wide statistics.
- Teacher CRUD with activate / deactivate / delete safety guards.
- Academic class CRUD (program-aware) and halaqah CRUD (teacher, level, program).
- Student CRUD across teachers with admin detail view.
- Academic Year management with archive workflow.
- **Archive module** — per-year student/teacher archives with bulk delete and
  AuditLog trail.
- Admin reports with Excel and PDF export.
- ProgramSelector with "Semua" (All) option for cross-program views.

### Added — Platform

- **Dual-program architecture** — `ProgramType` enum (`ACADEMIC`, `BOARDING`)
  on `AcademicClass` and `ClassGroup`; Boarding-specific UI rules (level/section
  hidden, grade cards hidden, numeric-only class labels).
- **Audit logging** — `AuditLog` model tracks destructive operations
  (`DELETE_STUDENT`, `DELETE_ARCHIVED_STUDENTS`, `DELETE_ACADEMIC_YEAR`,
  `CREATE_TASMI`, `UPDATE_TASMI`, `DELETE_TASMI`); `userId` nullable with
  `onDelete: SetNull` so the trail survives user deletion.
- **Exports** — Excel (exceljs) and PDF (pdfkit) with program-suffixed
  filenames, scoped per teacher / student / admin.
- **i18n** — next-intl with three locales: `id`, `en`, `ar` (RTL support).
- **PWA** — custom service worker, Web App Manifest, install prompt UI, and
  cached offline page.
- **Performance** — in-memory TTL cache with prefix-based invalidation and
  `withRetry` for transient database errors; optimistic UI updates.
- **Security** — role-based auth (NextAuth 5), rate limiting (Upstash Redis
  primary, in-memory fallback), IDOR protection, and security headers.
- **Theming** — light / dark / system / automatic via next-themes.

### Added — Documentation & delivery

- Teacher **User Guide** (Markdown + PDF + HTML), 50 pages, 25 screenshots,
  trilingual application imagery.
- **Presentation** deck (PowerPoint).
- Deployment, rollback, release-checklist, PWA-readiness, UAT, manual-test, and
  known-issues documentation.
- Cleaned, minimalist **application icon set** (SVG + PNG 192/512 + Apple touch).

### Fixed — Pre-release P0 issues (all resolved before release)

- **P0-1** — `global-error.tsx` used hardcoded Indonesian text. Replaced with an
  English fallback and added `<title>`.
- **P0-2** — No locale cookie validation in `i18n/request.ts`. Added a
  `locales.includes()` guard with silent fallback to the default locale.
- **P0-3** — In-memory rate limiter was not production-safe. Moved to Upstash
  Redis as primary store with in-memory `Map` as transparent fallback.
- **P0-4** — Arabic locale (`ar.json`) was missing 9 translation keys. Added all
  nine (`accessDenied*`, `inactive*`, `backToStudents`, `cancelReactivateButton`).

### Known limitations

- **Online-first PWA.** Per the release-mode decision in
  `documentation/RELEASE_CHECKLIST.md`, this release is an **online-first
  installable PWA**. Data entry and all admin changes require an internet
  connection. Offline mutation queue / background sync / draft persistence are
  intentionally out of scope for v1.0.0 (see `PWA_READINESS_REPORT.md`).
- **No git release tags prior to v1.0.0.** This is the first tagged release.

### Tech stack at release

Next.js 15.5 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 ·
Prisma 7.8 (`@prisma/adapter-pg`) · PostgreSQL (Neon) · NextAuth 5 ·
Upstash Redis · next-intl · exceljs · pdfkit · lucide-react · sonner · next-themes.

[1.0.0]: https://github.com/azkafarhanm/tahfidz-tracker/releases/tag/v1.0.0
