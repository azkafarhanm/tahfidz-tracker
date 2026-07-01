# TahfidzFlow v1.0.0 — Release Notes

**Release date:** 2026-07-01 (Asia/Jakarta, WIB)
**Type:** First production release (GA)
**Source commit:** `94ee97b`
**Git tag (to create at release):** `v1.0.0`

> TahfidzFlow is a mobile-first Quran memorization (tahfidz) tracking platform for Islamic
> schools serving SMP grades 7–9. It records hafalan, murojaah, and Tasmi' sessions, derives
> formative recaps, manages flexible summative assessments, and exports reports — across a
> dual **Academic + Boarding** program architecture.

---

## Highlights

- **Dual-program architecture.** A `ProgramType` enum (`ACADEMIC`, `BOARDING`) on
  `AcademicClass` and `ClassGroup` lets a single teacher work across a day-school program and
  a boarding (pondok) program without data collisions. Boarding-specific UI rules hide grade
  level and section while keeping one unified data model.
- **Full hafalan lifecycle.** Quick Log → Hafalan → Murojaah → Tasmi' → auto-generated
  formative recap → flexible summative assessment.
- **Admin management suite.** CRUD for teachers, academic classes, halaqah, and students,
  plus academic-year management with an archive workflow.
- **Audit trail.** Every destructive operation (student/year deletion, Tasmi' create/update/
  delete) is recorded in an `AuditLog` that survives user deletion (`onDelete: SetNull`).
- **Exports.** Excel and PDF exports for teacher, student, admin, formative, and summative
  reports, with program-suffixed filenames (`akademik` / `boarding` / `semua`).
- **PWA + i18n.** Installable, offline-aware shell; three languages (Indonesian, English,
  Arabic) with full RTL support.
- **Production hardening.** Role-based auth, login rate limiting on Upstash Redis (in-memory
  fallback), IDOR protection, security headers, in-memory TTL cache, and a `withRetry` wrapper
  for transient Neon connection errors.

---

## What's included in v1.0.0

### Teacher experience
- Dashboard with daily stats, weekly target progress, and recent activity (including Tasmi').
- Program-aware filtering via `ProgramSelector` (Academic / Boarding).
- Student list with search, pagination, latest records, Tasmi' badges, and review indicators.
- Guided **Quick Log** record entry.
- Hafalan and murojaah create / edit / delete with surah + ayah-range input.
- **Tasmi'** module: per-juz sessions with grade, status, and examiner.
- Formative recap generated automatically from daily records, per semester.
- Flexible **summative** assessment per student and per surah, with auto-passed surah detection.
- Active targets with cancel / complete actions.
- Student detail with history, targets, Tasmi' summary, and Excel + PDF exports.
- Teacher reports with Excel + PDF export and context-aware back navigation.

### Admin experience
- Admin dashboard with system-wide statistics.
- Teacher CRUD with activate / deactivate / delete safety guards.
- Academic class CRUD (program-aware).
- Halaqah CRUD with teacher assignment, level, and program type.
- Student CRUD across teachers with an admin detail view.
- Academic Year management with an archive workflow (per-year student/teacher archives, bulk
  delete, and `AuditLog` trail).
- Admin reports with Excel + PDF export.
- `ProgramSelector` with a **"Semua"** (All) option for cross-program views.

### Platform
- Next.js 15 App Router with Server Components and Server Actions.
- Prisma 7 + PostgreSQL (Neon) via `@prisma/adapter-pg`.
- NextAuth 5 (beta) role-based auth with JWT sessions.
- Rate-limited login persisted to Upstash Redis (transparent in-memory fallback).
- Full i18n: Indonesian, English, Arabic with RTL.
- PWA: install prompt, service worker, offline banner.
- Dark mode (system / light / dark / scheduled).
- In-memory TTL cache (`globalThis`-backed) with prefix-based invalidation.
- All timestamps rendered in Asia/Jakarta (WIB, UTC+7).
- Security headers on all routes: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5 (App Router) |
| UI | React 19, TypeScript 5, Tailwind CSS 4 |
| Database | PostgreSQL (Neon), Prisma 7.8 with `@prisma/adapter-pg` |
| Auth | NextAuth 5 beta, bcryptjs |
| Rate limiting | Upstash Redis (`@upstash/redis`) |
| i18n | next-intl (id, en, ar) |
| Exports | exceljs (Excel), pdfkit (PDF) |
| PWA | Custom service worker + Web App Manifest |
| CI | GitHub Actions (`.github/workflows/verify.yml`) |

---

## Data model

### Enums
`UserRole` · `Gender` · `HalaqahLevel` · `RecordStatus` · `TargetType` · `TargetStatus` ·
`Semester` · `ProgramType` · `AcademicYearStatus` · `TasmiGrade` · `TasmiStatus` · `AuditAction`

### Core models
`User`, `Teacher`, `AcademicYear`, `AcademicClass`, `ClassGroup`, `Student`,
`MemorizationRecord`, `RevisionRecord`, `TasmiRecord`, `Target`, `SummativeScore`, `Surah`,
`TargetSurah`, `AuditLog`, and the NextAuth tables `Account`, `Session`, `VerificationToken`.

### Key business rules
- `ProgramType` lives only on `AcademicClass` and `ClassGroup` — never on record tables or
  `AcademicYear`.
- `AcademicYear` is global and single; it is the archive boundary.
- Formative scores derive from real daily hafalan/murojaah records; summative scores are
  flexible per student and per surah.
- Export filenames carry a program suffix (`akademik` / `boarding` / `semua`).
- All timestamps display in Asia/Jakarta (WIB).

---

## Database migrations in this release

This release contains 17 Prisma migrations under `web/prisma/migrations/`, from
`20260428061120_init` through `tasmi_student_createdAt_idx`. Apply them to the production
database **before** deploying new code (see `docs/DEPLOYMENT.md → Prisma Migration Procedure`).

Migration order:

1. `20260428061120_init`
2. `20260428190000_academic_classes_halaqah_levels`
3. `20260504083000_classgroup_academic_class_link`
4. `20260504103000_classgroup_grade_year_model`
5. `20260516193000_add_hot_path_indexes`
6. `20260520000000_fix_classgroup_unique_add_level`
7. `20260524093000_merge_duplicate_classgroups_restore_unique`
8. `20260527193000_add_case_insensitive_search_indexes`
9. `20260611092007_add_academic_year_table`
10. `20260612124926_add_username_to_user`
11. `20260614105819_add_academic_year_semester_to_records`
12. `20260614193915_add_academic_year_status`
13. `20260615120000_add_audit_log`
14. `20260615140000_add_tasmi_record`
15. `20260615160000_add_program_type`
16. `audit_log_user_nullable`
17. `tasmi_student_createdAt_idx`

---

## Upgrade / install notes

This is the first GA release, so there is no in-place upgrade path from an earlier version.

**Fresh production install (summary — see `docs/DEPLOYMENT.md` for the full guide):**
1. Provision Neon PostgreSQL and Upstash Redis (or Vercel KV).
2. Set production environment variables (template: `config/env.production.example`).
3. Apply migrations: `npm run db:deploy` (runs `prisma migrate deploy`).
4. (Optional) Seed reference surah data only: `npm run db:seed:summative` — **do not** seed
   demo teachers/students into production.
5. Deploy to Vercel with Root Directory = `web`.
6. Log in as admin and create an **active `AcademicYear`** before onboarding teachers — the
   system requires one active year to function correctly.

---

## Known limitations

Confirmed against `docs/KNOWN_ISSUES.md`, `docs/PWA_READINESS_REPORT.md`, and `docs/PWA_BUGS.md`.

- **No open P0 issues.** All four original P0 defects (global-error i18n, locale cookie
  validation, production-safe rate limiter, missing Arabic keys) are resolved.
- **PWA is online-first.** Data entry and admin changes require an internet connection. Offline
  mutation queueing / background sync is **not** part of v1.0.0. If shipping as an installable
  PWA, communicate this limitation to users and complete the PWA gate in
  `docs/RELEASE_CHECKLIST.md`.
- **Single, fixed timezone.** All date/time formatting is hardcoded to Asia/Jakarta (WIB).
  There is no per-user timezone setting; changing it requires editing `web/src/lib/format.ts`
  and the export route formatters.
- **Rate-limiting fallback.** Without `KV_REST_API_URL` + `KV_REST_API_TOKEN`, rate limiting
  falls back to an in-memory map that does not persist across serverless instances. Configure
  Redis for production.
- **Demo credentials are for non-production only.** The seeded `admin` / teacher demo accounts
  must never be seeded into a production database.

---

## Security

- Role-based auth (ADMIN / TEACHER) enforced at layout and server-action level.
- Teacher-scoped data isolation via `teacherId` on all user-data models; IDOR protection in
  record and student flows.
- Login rate limiting: 5 attempts / 10-minute window / 15-minute block (Upstash Redis).
- Delete/deactivate guards for entities with dependent records.
- `AuditLog` trail for all destructive operations.
- Security headers on all routes; locale-cookie validation; `returnTo` open-redirect guard on
  record edit forms.

---

## Verification summary

- **CI (`.github/workflows/verify.yml`)** runs on every push to `main` and every PR: Prisma
  schema validation → ESLint → TypeScript typecheck → Vitest unit tests → Next.js production
  build. All steps must pass before merge.
- **Unit tests** cover `academic-year`, `cache`, `form-helpers`, `rate-limit`, and `students`
  (`web/src/lib/*.test.ts`).
- **UAT** results and checklist are recorded in `docs/TEST_RESULTS.md` and
  `docs/UAT_CHECKLIST.md`; role-based manual QA lives in `docs/MANUAL_TEST_CHECKLIST.md`.

See [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) for the full gated release procedure.

---

## Credits

Built and maintained by the TahfidzFlow team. Licensed under the MIT License.
