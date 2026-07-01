# Changelog

All notable changes to TahfidzFlow are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-07-01

First production (GA) release. Source commit `94ee97b`.

### Added
- **Dual-program architecture** — `ProgramType` (`ACADEMIC`, `BOARDING`) on `AcademicClass` and
  `ClassGroup`, with `ProgramSelector` context switching and a `ProgramBadge` on list/detail
  pages. Admins get a **"Semua"** (All) cross-program view.
- **Full hafalan lifecycle** — Quick Log, Hafalan, Murojaah, auto-generated Formative recap,
  and flexible per-surah Summative assessment.
- **Tasmi' module** — per-juz Tasmi' sessions with grade (`TasmiGrade`), status
  (`TasmiStatus`), and examiner name.
- **Admin management** — CRUD for teachers, academic classes, halaqah, and students; academic
  year management with an archive workflow.
- **Audit trail** — `AuditLog` model + `AuditAction` enum covering student/year deletion and
  Tasmi' create/update/delete; `userId` nullable with `onDelete: SetNull` to preserve history.
- **Exports** — Excel (exceljs) and PDF (pdfkit) for teacher, student, admin, formative, and
  summative reports, with program-suffixed filenames.
- **PWA** — Web App Manifest, service worker, install prompt, and offline banner/page.
- **i18n** — Indonesian, English, and Arabic (with RTL) via next-intl.
- **Performance** — in-memory TTL cache with prefix-based invalidation, `withRetry` for
  transient Neon errors, and optimistic UI for student-list mutations.
- **Security** — role-based auth (NextAuth 5), login rate limiting on Upstash Redis with
  in-memory fallback, IDOR protection, security headers, locale-cookie validation, and a
  `returnTo` open-redirect guard.
- Release package under `release/v1.0.0/` (release notes, checklist, manifest, config template).

### Fixed (pre-GA P0 hardening)
- Global error boundary no longer hardcodes Indonesian text (English fallback + `<title>`).
- Locale cookie validated against the allowed locale list before use.
- Rate limiter made production-safe (Redis primary, in-memory fallback; async API).
- Arabic locale completed with 9 previously missing `StudentDetail` keys.

### Known limitations
- PWA is **online-first**: data entry and admin changes require internet (no offline queue).
- All timestamps are fixed to Asia/Jakarta (WIB); no per-user timezone setting.
- Rate limiting requires `KV_REST_API_URL` + `KV_REST_API_TOKEN` to persist across serverless
  instances; otherwise it falls back to per-instance in-memory limiting.

### Database
- 17 Prisma migrations from `20260428061120_init` through `tasmi_student_createdAt_idx`.

[1.0.0]: https://github.com/azkafarhanm/tahfidz-tracker/releases/tag/v1.0.0
