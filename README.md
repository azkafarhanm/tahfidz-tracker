# TahfidzFlow

![CI](https://github.com/azkafarhanm/tahfidz-tracker/actions/workflows/verify.yml/badge.svg)
![Next.js](https://img.shields.io/badge/Next.js_15-black)
![React](https://img.shields.io/badge/React_19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791)
![License](https://img.shields.io/badge/License-MIT-yellow)

> A mobile-first Quran memorization tracking platform for Islamic schools — built with Next.js 15, Prisma 7, and a dual-program architecture.

TahfidzFlow is a production-ready tahfidz tracking system for SMP grades 7-9. It supports a dual-program architecture (Academic and Boarding), helping teachers record hafalan, murojaah, and Tasmi' sessions, review formative progress, manage flexible summative assessments, and export reports. Admins can manage teachers, halaqah, classes, students, academic years, and system-wide reports, with full audit logging for destructive operations.

---

## Screenshots

### Teacher

| Dashboard | Students |
|:---:|:---:|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Students](docs/screenshots/students.png) |

| Student Detail | Reports |
|:---:|:---:|
| ![Student Detail](docs/screenshots/student-detail.png) | ![Reports](docs/screenshots/reports.png) |

### Admin

| Admin Dashboard |
|:---:|
| ![Admin Dashboard](docs/screenshots/admin-dashboard.png) |

---

## Overview

### The Problem

Islamic schools track Quran memorization progress manually — through paper notebooks or spreadsheets. This leads to lost records, no centralized view of student progress, disconnected formative and summative assessments, and no easy way to see cross-class trends.

### Who Uses It

- **Teachers** — record daily hafalan (memorization), murojaah (revision), and Tasmi' (recitation) sessions; track weekly targets; review auto-generated formative recaps
- **Admins** — manage teachers, classes, halaqah groups, students, and academic years; view system-wide reports; archive completed years with audit trail

### Why Academic + Boarding

Many Islamic schools operate two parallel programs:

- **Academic** (Akademik) — regular day-school students with grade levels (7A, 8B, 9C) and sections
- **Boarding** (Pondok) — residential students in halaqah groups with different assessment rules

TahfidzFlow models this with a `ProgramType` enum on `AcademicClass` and `ClassGroup`, allowing teachers working in both programs to switch context without losing data. Boarding-specific UI rules hide irrelevant fields (grade level, section) while keeping the data model unified.

---

## Feature Highlights

| Area | Highlights |
|---|---|
| **Teacher Dashboard** | Daily stats, weekly target progress, recent activity with Tasmi' |
| **Dual-Program System** | Academic + Boarding with context-aware filtering via ProgramSelector |
| **Academic Meeting Context** | Per-student daily Hadir/Izin/Sakit/Alfa context with optional notes and zero-or-more Hafalan/Murojaah activities |
| **Workflow Persistence** | Search, filters, pagination, and scroll restored across primary navigation and frequent Students/Formative/Summative detail round-trips |
| **Full Hafalan Lifecycle** | Quick Log → Hafalan → Murojaah → Tasmi' → Formative recap → Summative |
| **Flexible Summative** | Curriculum-guided bulk scoring with Academic/Boarding targets and multi-row result highlighting |
| **Admin Management** | Teachers, classes, halaqah, students, academic years, formative meeting settings, and archive workflow |
| **Audit Trail** | All destructive operations logged (student/year/Tasmi' deletion) |
| **Exports** | Program-specific Academic/Boarding Excel and PDF reports, per teacher/student/admin |
| **PWA + i18n** | Installable online-first PWA, 3 languages (id/en/ar) with RTL support |
| **Performance** | In-memory TTL cache, `withRetry` for transient DB errors, optimistic UI |
| **Security** | Role-based auth, rate limiting, IDOR protection, security headers |

---

## Architecture

```text
Browser / PWA Client
    │
    ▼
┌──────────────────────────────────────────┐
│         Next.js 15 (App Router)           │
│                                          │
│  Middleware                               │
│    Auth (NextAuth 5) · i18n · PWA         │
│                                          │
│  Server Components + Server Actions       │
│    Teacher pages · Admin pages · API     │
│                                          │
│  In-Memory TTL Cache + withRetry          │
│    Prefix-based invalidation              │
└──────────┬──────────────────┬────────────┘
           │                  │
           ▼                  ▼
  ┌────────────────┐  ┌──────────────┐
  │  PostgreSQL    │  │ Upstash Redis │
  │  (Neon)        │  │ Rate Limiting │
  │  Prisma 7.8    │  │               │
  └────────────────┘  └──────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5 (App Router) |
| UI | React 19, TypeScript 5, Tailwind CSS 4 |
| Database | PostgreSQL (Neon), Prisma 7.8 with `@prisma/adapter-pg` |
| Auth | NextAuth 5 beta, bcryptjs |
| Rate Limiting | Upstash Redis |
| i18n | next-intl (id, en, ar) |
| Exports | exceljs (Excel), pdfkit (PDF) |
| Icons | lucide-react |
| Toasts | sonner |
| Theming | next-themes |
| PWA | Custom service worker, Web App Manifest |
| CI | GitHub Actions |

---

## Main Features

### Teacher workflow

- Dashboard with daily stats, weekly target progress, and recent activity (includes Tasmi')
- Program-aware filtering via ProgramSelector (Academic / Boarding)
- Student list with search, pagination, latest records, Tasmi' badges, and review indicators
- Students, Formative, and Summative detail round-trips restore the originating filters, pagination, and scroll position
- Quick Log guided record entry; for Academic students it can create a missing status for today once, while existing status is read-only metadata and Boarding remains unchanged
- Hafalan and murojaah create/edit/delete with surah + ayah range input
- Tasmi' module: create/edit/delete per-juz Tasmi' records with grade and examiner
- Formative recap generated automatically from daily records, per semester; Academic Excel uses the configured semester meeting timeline
- Curriculum-guided bulk summative assessment with Academic/Boarding target rules and multi-row highlight after save
- Active targets with cancel/complete actions
- Student detail with history, targets, Tasmi' summary, and exports (Excel + PDF)
- Academic Student Detail includes Meeting History; one optional-note status per day can exist even with no Hafalan/Murojaah activity
- Academic Student Detail shows lightweight today's-status metadata, active Academic Year/semester attendance counts, and monthly collapsible Meeting History with per-meeting activity totals
- Teacher reports with program-specific Excel/PDF layouts and context-aware back navigation

### Admin workflow

- Admin dashboard with system-wide statistics
- Teacher CRUD with activate/deactivate/delete safety guards
- Academic class CRUD (program-aware)
- Halaqah CRUD with teacher assignment, level, and program type
- Student CRUD across teachers with admin detail view
- Academic Year management with archive workflow and per-semester formative meeting controls
- Archive module: per-year student/teacher archives with bulk delete and AuditLog trail
- Admin reports with Excel and PDF export
- ProgramSelector with "Semua" (All) option for cross-program views

### Program Type system

- `ProgramType` enum (`ACADEMIC`, `BOARDING`) on `AcademicClass` and `ClassGroup`
- `MeetingStatus` stores `ProgramType.ACADEMIC` explicitly and is never queried or rendered for Boarding students
- Teachers see only their program context (auto-detected from ClassGroups; selector shown for dual-program teachers)
- Admins get a "Semua" (All) option in addition to per-program filtering
- Program context persists across navigation and program-filtered live search via URL params
- Boarding-specific UI rules: level hidden, section hidden, grade cards hidden, class labels show numeric grade only
- `ProgramBadge` display component on all list/detail pages
- `ProgramSelector` context-switching control on all filtered pages

### Report exports

- Meeting Status is intentionally excluded from dashboards, reports, Excel exports, and PDF exports in Phase 1.

- Academic Formative Excel uses one configured meeting count for the whole Academic semester. Every class sheet shares the same `Pertemuan 1..N` columns, and missed meetings remain blank.
- Boarding Formative Excel is grouped into `Kelas 7`, `Kelas 8`, and `Kelas 9` progress sheets with setoran totals, memorization/revision progress, and latest setoran.
- Boarding Summative Excel uses an Info sheet plus class sheets containing per-student Surah/Nilai blocks and latest-assessment summaries.
- Teacher PDF reports preserve separate Academic and Boarding sections. Academic rows are grouped by grade and parallel class; Boarding rows are grouped by grade.
- Export output omits Halaqah Level. The level remains an internal Academic workflow field and is not part of institutional report columns.

### Audit Logging

- `AuditLog` model tracks destructive operations
- Actions: `DELETE_STUDENT`, `DELETE_ARCHIVED_STUDENTS`, `DELETE_ACADEMIC_YEAR`, `CREATE_TASMI`, `UPDATE_TASMI`, `DELETE_TASMI`
- `userId` nullable with `onDelete: SetNull` — preserves trail even after User deletion
- Indexed by `userId`, `action`, `academicYearId`, `createdAt`

### Platform

- Next.js 15 App Router with Server Components and Server Actions
- Prisma 7 + PostgreSQL (Neon) with `@prisma/adapter-pg`
- NextAuth 5 (beta) role-based auth with JWT sessions
- Rate-limited login with Upstash Redis persistence
- Full i18n: Indonesian, English, Arabic with RTL support
- PWA: install prompt, service worker, offline banner
- Dark mode (system/light/dark/auto with 6am/6pm schedule)
- Responsive desktop/mobile layout with sidebar navigation
- In-memory TTL cache (`globalThis`-backed) with prefix-based invalidation
- `withRetry` wrapper for transient Neon connection errors (exponential backoff)
- Optimistic UI for student list mutations (instant count updates with rollback on failure)
- All timestamps displayed in Asia/Jakarta (WIB) timezone
- Security headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, COOP
- GitHub Actions CI: schema validation, lint, typecheck, unit tests, build

---

## Demo Accounts

Demo data is seeded via `npm run db:seed` and may vary by environment.

| Role | Login | Password |
|---|---|---|
| Admin | `admin` | `2026` |
| Teacher 1 | `teacher.demo@tahfidzflow.local` | `2026` |
| Teacher 2 | `teacher.salwa@tahfidzflow.local` | `2026` |

> After a full database reset (`reset-school.ts`), only the admin account and 114 Surah entries remain. Run `npm run db:seed` to restore demo teachers and students.

---

## Project Structure

```text
tahfidz-tracker/
  .github/workflows/verify.yml
  docs/
  rules.md
  web/
    prisma/
      schema.prisma
      seed.ts
      seed-summative.ts
      reset-school.ts          -- full fresh-install reset
      reset-uat-data.ts        -- full UAT reset (keeps admin + surah only)
      reset-testing-data.ts    -- testing data reset
      cleanup-production.ts    -- production operational-data + halaqah cleanup
      migrations/
    messages/
      id.json, en.json, ar.json
    public/
      manifest.json, sw.js
    src/
      app/          -- Next.js App Router pages and layouts
      components/   -- Shared React components
      hooks/        -- Custom React hooks (scroll preservation, highlight)
      i18n/         -- Locale config, actions, request handler
      lib/          -- Server utilities (prisma, session, rate-limit, cache, etc.)
      generated/    -- Prisma generated client
```

The Next.js app lives in `web/`. Vercel Root Directory must be set to `web`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g., `postgresql://user:pass@host/db?sslmode=require`) |
| `AUTH_SECRET` | Yes | Random secret for NextAuth JWT signing. Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Yes | Production URL (e.g., `https://your-domain.com`). Omit for local dev (defaults to `http://localhost:3000`) |
| `KV_REST_API_URL` | Recommended | Upstash Redis REST URL. Rate limiting falls back to in-memory without it |
| `KV_REST_API_TOKEN` | Recommended | Upstash Redis REST token |
| `APP_DEFAULT_LOCALE` | No | Default locale. Defaults to `id` |
| `DATABASE_POOL_MAX` | No | Max Prisma pool connections. Defaults to 10 (production) or 5 (dev) |
| `APP_CACHE_DEBUG` | No | Set to `true` to enable cache hit/miss logging |
| `APP_MEMORY_CACHE_MAX_ENTRIES` | No | Max in-memory cache entries. Defaults to 500 |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or Neon)

### Steps

```bash
cd web
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL and AUTH_SECRET

npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000/login`.

### Commands (from `web/`)

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run start` | Start production server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Vitest unit tests |
| `npm run verify:fast` | generate + validate + lint + typecheck |
| `npm run verify` | Full pipeline including tests and build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:validate` | Validate Prisma schema |
| `npm run db:migrate` | Create and apply migration (dev) |
| `npm run db:seed` | Seed demo teachers/students + surah data |
| `npm run db:seed:base` | Seed demo teachers/students only |
| `npm run db:seed:summative` | Seed 114 surah entries + target curriculum |
| `npm run db:cleanup-production` | Delete production students, records, audit logs, and halaqah while preserving users, teachers, academic years/classes, meeting settings, Surah, and TargetSurah |
| `npm run db:studio` | Open Prisma Studio |

### Database Reset Scripts

Review each script's preservation rules before running it against any shared database:

```bash
# Full fresh-install reset: keeps only admin User + 114 Surah
node --env-file=.env --import tsx prisma/reset-school.ts

# Full UAT reset: keeps admin accounts + Surah + TargetSurah only
# Deletes teachers, classes, halaqah, students, all records, targets, scores, audit logs
node --env-file=.env --import tsx prisma/reset-uat-data.ts

# Testing data reset
node --env-file=.env --import tsx prisma/reset-testing-data.ts

# Production cleanup: preserves users, teachers, AcademicYear meeting settings,
# AcademicClass, Surah, TargetSurah, and auth/session data. Deletes all students,
# operational records, audit logs, and ClassGroup (Halaqah) rows in one transaction.
npm run db:cleanup-production
```

`db:cleanup-production` is destructive. Take a database backup before running it; application deployment rollback cannot restore deleted rows.

### Pre-push Verification

```bash
npm run verify:fast
npm run build
```

CI runs on every push to `main` and every PR.

---

## Production Deployment

TahfidzFlow is deployed on Vercel. For the full deployment guide (Vercel setup, Neon database, Upstash Redis, post-deploy checklist), see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

To apply production migrations safely:

```bash
npx prisma migrate deploy
```

For rollback procedures, see [`docs/ROLLBACK.md`](docs/ROLLBACK.md).

---

## Data Model

### Enums

| Enum | Values |
|---|---|
| `UserRole` | `ADMIN`, `TEACHER` |
| `Gender` | `MALE`, `FEMALE` |
| `HalaqahLevel` | `LOW`, `MEDIUM`, `HIGH` |
| `RecordStatus` | `LANCAR`, `CUKUP`, `PERLU_MUROJAAH` |
| `TargetType` | `HAFALAN`, `MUROJAAH` |
| `TargetStatus` | `ACTIVE`, `COMPLETED`, `MISSED`, `CANCELLED` |
| `Semester` | `GANJIL`, `GENAP` |
| `ProgramType` | `ACADEMIC`, `BOARDING` |
| `AcademicYearStatus` | `ACTIVE`, `ARCHIVED` |
| `TasmiGrade` | `MUMTAZ`, `JAYYID_JIDDAN`, `JAYYID`, `MAQBUL` |
| `TasmiStatus` | `LULUS`, `MENGULANG` |
| `AuditAction` | `DELETE_STUDENT`, `DELETE_ARCHIVED_STUDENTS`, `DELETE_ACADEMIC_YEAR`, `CREATE_TASMI`, `UPDATE_TASMI`, `DELETE_TASMI` |

### Models

| Model | Description |
|---|---|
| `User` | Auth account (`ADMIN` or `TEACHER` role). Includes `username` (unique, auto-generated from email) |
| `Teacher` | Profile linked to User |
| `AcademicYear` | School year with start/end dates, `isActive`, `status`, and separate Ganjil/Genap formative meeting counters |
| `AcademicClass` | School class (7A, 8B, 9C) scoped by academic year and `programType` |
| `ClassGroup` | Halaqah, owned by a teacher, scoped by grade + academic year + `programType` |
| `Student` | Linked to teacher, class group, and optional academic class |
| `MemorizationRecord` | Daily hafalan record (formative source), scoped by academicYear + semester |
| `RevisionRecord` | Daily murojaah record (formative source), scoped by academicYear + semester |
| `TasmiRecord` | Per-juz Tasmi' session with grade, status, examiner name, scoped by academicYear + semester |
| `Target` | Progress target with date range and status lifecycle |
| `SummativeScore` | Per-surah assessment per semester |
| `Surah` | Quran surah reference data (114 entries) |
| `TargetSurah` | Curriculum mapping per grade + semester |
| `AuditLog` | Destructive operation trail (student/year deletion, Tasmi' CRUD) |
| `Account`, `Session`, `VerificationToken` | NextAuth persistent session infrastructure |

### Key Business Rules

- **ProgramType** exists only on `AcademicClass` and `ClassGroup` — never on record tables or `AcademicYear`
- AcademicYear remains global and single; serves as the archive boundary
- Formative meeting counters default to `1` for each semester and are the source of truth for Academic Formative Excel columns
- Boarding `HalaqahLevel` (`LOW`) is stored internally but never shown in UI
- Formative scores derive from real daily hafalan and murojaah records
- Summative entry supports curriculum-guided bulk scoring; Boarding uses grade-specific targets while Academic can also record additional memorization
- Targets track status lifecycle: `ACTIVE` -> `COMPLETED` / `CANCELLED` / `MISSED`
- Export filenames include programType suffix (`akademik`/`boarding`/`semua`)
- All timestamps displayed in Asia/Jakarta (WIB, UTC+7) timezone

---

## Security

- Role-based auth (ADMIN / TEACHER) enforced at layout and server action level
- Teacher-scoped data isolation via `teacherId` on all user-data models
- IDOR protection in record and student flows
- Login rate limiting: 5 attempts / 10 min window / 15 min block (Upstash Redis)
- Delete/deactivate guards for entities with dependent records
- AuditLog trail for all destructive operations (student/year/Tasmi' deletion)
- Security headers on all routes (X-Frame-Options DENY, nosniff, etc.)
- Locale cookie validation prevents injection attacks
- `returnTo` open-redirect guard on all record edit forms

---

## Documentation

| File | Purpose |
|---|---|
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Vercel deployment, migrations, KV setup, post-deploy checklist |
| [`docs/ROLLBACK.md`](docs/ROLLBACK.md) | Rollback procedures for Vercel and database |
| [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md) | Known outstanding issues |
| [`docs/TEST_RESULTS.md`](docs/TEST_RESULTS.md) | Full UAT audit results (192 items) |
| [`docs/UAT_CHECKLIST.md`](docs/UAT_CHECKLIST.md) | UAT checklist with PASS/FAIL criteria |
| [`docs/MANUAL_TEST_CHECKLIST.md`](docs/MANUAL_TEST_CHECKLIST.md) | Role-based manual testing guide |
| [`docs/PWA_READINESS_REPORT.md`](docs/PWA_READINESS_REPORT.md) | PWA readiness assessment |
| [`docs/PWA_BUGS.md`](docs/PWA_BUGS.md) | PWA bug inventory and severity |
| [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) | PWA release decision checklist |
| [`docs/PERSISTENCE_ARCHITECTURE.md`](docs/PERSISTENCE_ARCHITECTURE.md) | Navigation context and scroll persistence design |
| [`docs/WORKFLOW_PERSISTENCE_PHASE_3B_AUDIT.md`](docs/WORKFLOW_PERSISTENCE_PHASE_3B_AUDIT.md) | Phase 3B high-frequency workflow persistence candidates |
| [`docs/ui-ux-speed-improvements-plan.md`](docs/ui-ux-speed-improvements-plan.md) | Performance optimization plan |
| [`AI_CONTEXT.md`](AI_CONTEXT.md) | AI handoff context and architecture overview |
| [`rules.md`](rules.md) | AI coding rules and engineering principles |

---

## Roadmap

### v1.0 — Production Ready

- [x] Dual-program architecture (Academic + Boarding)
- [x] Full hafalan lifecycle: Quick Log, Hafalan, Murojaah, Tasmi', Formative, Summative
- [x] Admin CRUD: teachers, classes, halaqah, students, academic years
- [x] Archive workflow with AuditLog trail
- [x] Excel + PDF exports (teacher, student, admin, formative, summative)
- [x] PWA: installable, offline banner, service worker
- [x] i18n: Indonesian, English, Arabic with RTL
- [x] Security: role-based auth, rate limiting, IDOR protection, security headers
- [x] Performance: in-memory TTL cache, withRetry, optimistic UI

### v1.1 — Navigation and Workflow Persistence

- [x] Primary-navigation search, filter, pagination, and scroll restoration
- [x] Students → Detail → Back workflow persistence
- [x] Formative → Detail → Back workflow persistence
- [x] Summative → Detail → Back workflow persistence
- [x] Program-aware live search on Students and Admin Students, Classes, and Halaqah

---

## License

This project is licensed under the MIT License.
