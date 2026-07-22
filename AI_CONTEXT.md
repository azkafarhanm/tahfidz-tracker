# AI Context: TahfidzFlow

Updated: 2026-06-21

This file is the current handoff context for the TahfidzFlow codebase.

## Current Status

- Production-ready core with dual-program (Academic/Boarding) architecture
- Teacher and admin flows are implemented and build-green
- ProgramType system deployed across all pages, queries, and exports
- Tasmi' module fully integrated (CRUD, dashboard, exports)
- AcademicYear/Archive system with admin management and archive workflow
- AuditLog system tracking all destructive operations
- Optimistic UI for student list mutations
- In-memory TTL cache with prefix-based invalidation
- `withRetry` wrapper for Neon transient connection errors
- GitHub Actions CI verifies schema, lint, typecheck, unit tests, and build
- Timezone hardcoded to Asia/Jakarta (WIB) across all date/time formatters

## Completion Snapshot

| Area | Status |
|---|---|
| Foundation | 100% |
| Teacher workflow | 100% |
| Admin workflow | 100% |
| ProgramType (Academic/Boarding) | 100% |
| Tasmi' module | 100% |
| AcademicYear / Archive | 100% |
| AuditLog system | 100% |
| Grading architecture | 100% |
| Reports and export | 100% |
| Multilingual UI | 97% |
| Layout and theming | 100% |
| Security hardening | 100% |
| Performance baseline | 97% |
| Optimistic UI | 95% |
| CI verification | 100% |
| Automated tests | 10% |

## What the App Does

### Teacher side
- Dashboard with stats, progress, motivation card, recent activity (Hafalan, Murojaah, Tasmi'), and ProgramBadge
- ProgramSelector for dual-program teachers (auto-detect for single-program)
- Student list with search, pagination, Tasmi' badges, inactive tabs, and optimistic count updates
- Quick Log for fast entry; Academic selection reads today's Meeting Status and can create a missing status before entry, while Boarding keeps the original flow
- Create/edit/delete hafalan and murojaah
- Tasmi' module: create/edit/delete per-juz records with grade, status, and examiner
- Target CRUD
- Formative recap generated from daily records
- Flexible summative assessments per student and per surah
- Teacher Excel and PDF exports (program-aware filenames)
- Context-aware navigation (`returnTo=reports` forwarded through detail pages)

### Admin side
- Admin dashboard with ProgramSelector ("Semua" option)
- Teacher CRUD with deletion guards and auto-generated usernames
- Academic class CRUD (program-aware)
- Halaqah CRUD (program-aware, student counts filter active only)
- Student CRUD with Boarding-specific form behavior
- AcademicYear management with archive workflow
- Archive module: per-year student/teacher archive views, bulk delete with AuditLog
- Admin-level reports and exports (program-aware)

### Platform
- PWA with install prompt and offline banner
- i18n with Indonesian, English, and Arabic
- RTL support
- Dark mode (auto/light/dark/system)
- Responsive desktop sidebar and mobile bottom nav
- In-memory cache (globalThis-backed, TTL, prefix-based invalidation)
- withRetry for transient Neon connection errors

## Architecture Overview

### ProgramType System

- `ProgramType` enum (`ACADEMIC`, `BOARDING`) lives on `AcademicClass` and `ClassGroup` only
- All `lib/*.ts` query modules accept optional `programType` parameter and filter via `student.classGroup.programType`
- Teachers: program context auto-detected from their ClassGroups via `getTeacherProgramContext` (cached 30s)
- Admins: "Semua" (undefined) option in addition to per-program selection
- Program context propagated through all navigation via URL `?programType=` params
- `ProgramSelector` — context-switching control (changes program filter)
- `ProgramBadge` — display-only badge (AKADEMIK green / BOARDING blue)
- Boarding UI rules: level hidden, section hidden, grade cards hidden, class labels show numeric grade

### Tasmi' Module

- `TasmiRecord` model with `TasmiGrade` (MUMTAZ/JAYYID_JIDDAN/JAYYID/MAQBUL) and `TasmiStatus` (LULUS/MENGULANG)
- Pages: `/students/[id]/tasmi/new`, `/students/[id]/tasmi/[tasmiId]/edit`
- Integrated into dashboard activity feed, student detail history, and all exports
- `lib/tasmi.ts` provides labels, options, CRUD helpers, and cache invalidation
- `@@index([studentId, createdAt])` for recent-records query performance

### Academic Meeting Status

- `MeetingStatus` is daily learning-meeting context, not school attendance and not a Hafalan/Murojaah activity.
- Scope is strictly `ProgramType.ACADEMIC`; Boarding queries and UI remain unchanged.
- `MeetingAttendanceStatus`: `HADIR`, `IZIN`, `SAKIT`, `ALFA`.
- Unique key: `(studentId, programType, date)`; saving the same date uses an upsert.
- Notes are nullable and always optional. A meeting with zero learning activities is valid.
- Student Detail groups Hafalan/Murojaah into a status day using the Asia/Jakarta day key.
- Academic Student Detail derives exact-today metadata from the timeline query and active-semester status counts from a database `groupBy` bounded by the configured active Academic Year plus `getSemesterForDate()`/`getSemesterDateRange()`.
- Student, Academic Meeting Status timeline, and four-group semester aggregation queries run concurrently; the detail cache key includes the Jakarta day to make midnight rollover immediate.
- Meeting History groups the existing newest-first timeline in memory by month. Native disclosure sections open the newest month by default, preserve independent non-persistent UI state, and also open any month targeted by URL highlight.
- Academic Quick Log resolves today's status in one batched student-list query. A missing status is created with `create` (never `upsert`); a unique-key race returns the existing row without editing it. Newly created non-Hadir statuses suppress activity inputs, while any pre-existing status is shown as read-only metadata and leaves the normal record workflow available. Boarding performs no Meeting Status query or mutation.
- Phase 1 excludes Meeting Status from dashboard, report, PDF, and Excel data paths.

### AcademicYear and Archive System

- `AcademicYear` model with `startDate`, `endDate`, `isActive`, `status` (`ACTIVE`/`ARCHIVED`)
- Single active year at a time — serves as archive boundary
- Admin pages: `/admin/academic-years` with CRUD, per-year student/teacher archive views
- Archive deletion operations create `AuditLog` entries (`DELETE_ARCHIVED_STUDENTS`, `DELETE_ACADEMIC_YEAR`)
- Records are scoped by `academicYear` + `semester` on `MemorizationRecord`, `RevisionRecord`, `TasmiRecord`, `SummativeScore`

### AuditLog System

- `AuditLog` model with `userId` (nullable, `onDelete: SetNull`), `action`, `targetType`, `targetId`, `metadata` (JSON)
- Actions: `DELETE_STUDENT`, `DELETE_ARCHIVED_STUDENTS`, `DELETE_ACADEMIC_YEAR`, `CREATE_TASMI`, `UPDATE_TASMI`, `DELETE_TASMI`
- Indexed by `userId`, `action`, `academicYearId`, `createdAt`
- Preserves audit trail even after User deletion

### Cache Architecture

- `lib/cache.ts`: `globalThis`-backed `Map` (shared across all module instances in the same Node.js process)
- `cached(key, ttlSeconds, fn)` — wraps async function with TTL-based caching
- `invalidateCache(prefix)` — removes all entries whose key starts with the prefix
- `invalidateStudentRelatedCaches(studentId?)` — invalidates all student-dependent prefixes
- `APP_CACHE_DEBUG=true` enables hit/miss logging
- Cached modules: dashboard, formative, summative, reports, admin, students, quick-log, teacher-program, tasmi-detail

### Database Connection Layer

- `lib/prisma.ts`: PrismaClient with `@prisma/adapter-pg`, connection pooling, SSL, and DNS fallback for Neon
- `withRetry(fn, maxRetries, baseDelayMs)` — retries on transient connection errors with exponential backoff (200ms -> 400ms)
- All `Promise.all` blocks in `lib/admin.ts` and `lib/dashboard.ts` wrapped in `withRetry`
- Neon DNS fallback: resolves `.neon.tech` hosts via `1.1.1.1`/`8.8.8.8` to bypass local DNS issues

### Optimistic UI

- `ConfirmActionDialogButton` exposes `onBeforeConfirm` (fires before `startTransition`) and `onRollback` (fires on failure)
- `OptimisticNumber` client component wraps server-rendered counts, listens for custom events, syncs on `router.refresh()`
- `dispatchStudentChange(activeDelta, inactiveDelta)` custom events bridge sibling client components
- Student deactivation/reactivation/deletion all use optimistic updates

### Timezone

- All date/time formatting hardcoded to `Asia/Jakarta` (WIB, UTC+7)
- `getDateFormatter()` and `getTimeFormatter()` in `lib/format.ts` include `timeZone: "Asia/Jakarta"`
- Export routes also use `timeZone: "Asia/Jakarta"`
- No timezone cookie or per-user timezone — all users see WIB

## Important Business Rules

- `AcademicClass` is the school class such as `7A`, `8B`, `9C` — has `programType`
- `ClassGroup` is the halaqah owned by a teacher for a grade, year, and program — has `programType`
- Students from multiple academic sections can share one halaqah
- ProgramType does not appear on learning activity tables or `AcademicYear`; `MeetingStatus` is the deliberate exception because its Academic-only boundary is enforced in the database key and queries
- Boarding `HalaqahLevel` (`LOW`) is stored but never displayed
- AcademicYear is global and single; serves as archive boundary
- Formative is derived from daily hafalan and murojaah records
- Summative is flexible per student and per surah
- Target recommendations are not hard grading limits
- Exports remain Indonesian by institutional requirement
- Export filenames include programType suffix (`akademik`/`boarding`/`semua`)

## Demo Accounts

Demo data is seeded via `npm run db:seed` and may vary by environment.

| Role | Login | Password |
|---|---|---|
| Admin | `admin` | `2026` |
| Teacher 1 | `teacher.demo@tahfidzflow.local` | `2026` |
| Teacher 2 | `teacher.salwa@tahfidzflow.local` | `2026` |

## Tech Stack

- Next.js 15.5.18
- React 19.2
- TypeScript 5
- Tailwind CSS 4
- Prisma 7.8 with `@prisma/adapter-pg`
- PostgreSQL / Neon
- NextAuth 5 beta
- next-intl 4.11
- exceljs
- pdfkit
- next-themes
- sonner

## Critical Technical Notes

- Repo root: `D:\tahfidz-tracker`
- App root: `web/`
- Vercel Root Directory must be `web`
- Prisma enums are imported from `@/generated/prisma-next/enums`
- Prisma client is generated under `web/src/generated/prisma-next`
- `next build` is strict and will fail on lint/type issues
- In-memory cache lives in `web/src/lib/cache.ts` (globalThis-backed)
- CI lives in `.github/workflows/verify.yml`
- All npm commands run from `web/` directory
- Timezone is hardcoded to `Asia/Jakarta` — not configurable via env

## Key Files

| Path | Purpose |
|---|---|
| `web/src/app/page.tsx` | Teacher/admin dashboard entry |
| `web/src/app/formative/page.tsx` | Formative recap overview |
| `web/src/app/formative/[studentId]/page.tsx` | Formative detail |
| `web/src/app/summative/page.tsx` | Summative overview |
| `web/src/app/summative/[studentId]/page.tsx` | Summative detail |
| `web/src/app/summative/actions.ts` | Summative save/update/delete |
| `web/src/app/students/[id]/tasmi/new/page.tsx` | Tasmi' create |
| `web/src/app/students/[id]/tasmi/[tasmiId]/edit/page.tsx` | Tasmi' edit |
| `web/src/app/admin/academic-years/page.tsx` | AcademicYear management |
| `web/src/app/admin/academic-years/[id]/page.tsx` | Year archive detail |
| `web/src/app/students/program-select/page.tsx` | Teacher program activation |
| `web/src/app/profile/change-username/page.tsx` | Username change |
| `web/src/lib/formative.ts` | Formative recap query layer |
| `web/src/lib/summative.ts` | Summative query/save/export helpers |
| `web/src/lib/admin.ts` | Admin query layer |
| `web/src/lib/dashboard.ts` | Dashboard query layer |
| `web/src/lib/students.ts` | Student query/data layer |
| `web/src/lib/students-page-live.ts` | Student list (live search, optimistic) |
| `web/src/lib/tasmi.ts` | Tasmi' labels, CRUD, cache helpers |
| `web/src/lib/academic-year.ts` | Active year resolution, teacher program context |
| `web/src/lib/cache.ts` | In-memory TTL cache + invalidation |
| `web/src/lib/prisma.ts` | Prisma client, withRetry, DNS fallback |
| `web/src/lib/format.ts` | Date/time formatters (Asia/Jakarta), class summary |
| `web/src/lib/reports.ts` | Teacher/admin/student report data |
| `web/src/lib/session.ts` | Session scope helpers |
| `web/src/auth.ts` | NextAuth setup |
| `web/src/middleware.ts` | Auth middleware |
| `web/prisma/schema.prisma` | Database schema |
| `web/prisma/seed.ts` | Base demo seed |
| `web/prisma/seed-summative.ts` | Surah and target seed |
| `web/prisma/reset-school.ts` | Full fresh-install reset |
| `web/prisma/reset-uat-data.ts` | Operational data reset |
| `README.md` | Public repo guide |

## Commands

All commands run from `web/`:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run verify:fast
npm run verify
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:seed
npm run db:seed:base
npm run db:seed:summative
npm run db:studio
```

Database reset scripts (from `web/`):

```bash
node --env-file=.env --import tsx prisma/reset-school.ts
node --env-file=.env --import tsx prisma/reset-uat-data.ts
```

## CI

GitHub Actions (`.github/workflows/verify.yml`) runs on:
- push to `main`
- pull requests

CI coverage:
1. Prisma schema validation
2. ESLint
3. TypeScript type checking
4. Vitest unit tests
5. Next.js production build

## Remaining Known Gaps

- Limited automated test coverage (cache, academic year, form helpers, rate limit)
- No e2e/browser test coverage yet
- In-memory cache is per-instance only (not distributed)
- Export routes are synchronous and may need scaling later
- PWA offline mutation strategy not implemented (online-only writes)
- Some accessibility and UX polish remains
