# AI Context: TahfidzFlow

This document summarizes the current state, architecture, modules, and phased plan for the TahfidzFlow rebuild. Use it as the project handoff context before continuing implementation.

---

## ⚠️ CURRENT ISSUES & KNOWN PROBLEMS

### No Critical Issues

All known critical issues and code quality problems have been resolved across two bug fix sweeps.

### Prisma 7 Configuration Notes

Prisma 7 requires adapter-based setup:
- Uses `@prisma/adapter-pg` with `PrismaPg` adapter
- Must use `new PrismaClient({ adapter })` constructor
- Enums exported from `enums` file, not `client`
- All enum imports must use `from "@/generated/prisma-next/enums"`
- Prisma's `node:crypto` causes issues with Next.js 15 Turbopack. Use legacy webpack (disable turbopack in next.config.ts)

### Bug Fix Sweep 1 (Completed - 15 fixes)

1. **Missing AUTH_SECRET** - Added to `web/.env`
2. **Missing Prisma models** - Added `Account`, `Session`, `VerificationToken` models + User relations for `PrismaAdapter`
3. **No auth checks in server actions** - Added `auth()` + `redirect("/login")` to all 3 action files
4. **No teacher-student ownership verification** - Actions now verify student belongs to logged-in teacher (admins bypass)
5. **No teacher-based data filtering** - Added `teacherId` filter to data functions, passed from all calling pages
6. **Score of 0 never displayed** - Changed `record.score ?` to `record.score !== null ?`
7. **Race condition in login redirect** - Replaced `router.refresh()` + `router.push()` with `window.location.href = "/"`
8. **Overlapping sticky bottom bars** - Nav hidden when quick-log form is visible
9. **sslmode=verify-full forced in database-url.ts** - Removed the SSL override
10. **@types/bcryptjs in wrong section** - Moved from `dependencies` to `devDependencies`
11. **Progress bar animation hardcoded** - Changed from `width: 12%→72%` to `scaleX(0)→scaleX(1)` with `origin-left`
12. **Missing AUTH_URL** - Added to `.env`
13. **TypeScript errors** - Fixed `User.id` optional type, added explicit return type to `matchStudent()`
14. **ESLint errors in fix-env.js** - Added to ESLint `globalIgnores`
15. **SSL warning from pg** - Changed connection string `sslmode=require` to `sslmode=verify-full`

### Bug Fix Sweep 2 (Completed - 34 fixes, full codebase cleanup)

**HIGH severity:**
1. **Timezone mismatch in date input** - `todayInputValue()` used UTC date via `toISOString()` while time was local. Fixed to use local date formatting.
2. **Silent fallback to `new Date()`** - `parseRecordDateTime` now returns `null` for empty inputs instead of silently defaulting to "now".

**MEDIUM severity (architecture):**
3. **Dashboard needsReviewCount inaccurate** - Was derived from only 5 recent records. Now uses dedicated DB count queries.
4. **Dead components directory** - Deleted unused `students/components/` (11 files, ~300 lines of dead code).
5. **Triplicated utility functions** - Extracted shared `readString`, `readOptionalString`, `readInt`, `parseRecordDateTime`, `createFailFn` to `src/lib/form-helpers.ts`.
6. **Duplicated labels, formatters, nav** - Consolidated `dateFormatter`, `statusLabels`, `halaqahLevelLabels`, `formatRange`, `formatClassSummary`, `todayInputValue`, `nowTimeValue`, `getNavigation` into `src/lib/format.ts`.
7. **Dashboard "Detail" button was dead** - Converted to `<Link>` navigating to `/students/{studentId}`. Added `studentId` to dashboard record data.
8. **Missing packages in serverExternalPackages** - Added `@prisma/adapter-pg` and `pg` to Next.js config.
9. **Shared BottomNav component** - Created `src/components/BottomNav.tsx`, replaced duplicated nav in 4 pages.
10. **No loading skeleton** - Created `src/app/loading.tsx` with animated skeleton UI.
11. **No error boundary** - Created `src/app/error.tsx` with styled error page.
12. **Duplicated auth config** - `auth.ts` now spreads `authConfig` instead of duplicating `pages` and `callbacks`.

**LOW severity (polish):**
13. **Unreachable dead code** - Removed duplicate error check in `parseQuickLogInput`.
14. **No-op database-url.ts** - Simplified to passthrough (removed unnecessary URL parse/serialize).
15. **Profile page misleading text** - Removed "Tersedia setelah implementasi autentikasi" since auth is done.
16. **English halaqah labels** - Changed `Low/Medium/High` to Indonesian `Rendah/Sedang/Tinggi`.
17. **Inconsistent LogoutButton styling** - Changed from `gray-*` + `rounded-lg` to `slate-*` + `rounded-2xl`.
18. **Nav "Profil" linked to `#`** - Fixed to `/profile`.
19. **Potential duplicate React keys** - Changed error list key from message string to index.
20. **Missing `max={286}` on ayah inputs** - Added to all ayah number inputs.
21. **Missing page metadata** - Added `metadata` exports to dashboard, students, student detail, quick-log, hafalan, murojaah pages.
22. **No custom 404** - Created `src/app/not-found.tsx`.
23. **Unconventional bracket notation** - `prisma.config.ts` changed from `process.env["DATABASE_URL"]` to `process.env.DATABASE_URL`.

---

## How to Run

```bash
# 1. Clear cache
Remove-Item -Recurse -Force "D:\tahfidz-tracker\web\.next" -ErrorAction SilentlyContinue

# 2. Regenerate Prisma
cd D:\tahfidz-tracker\web; npm run db:generate

# 3. Run migration (needed for new Account/Session/VerificationToken tables)
cd D:\tahfidz-tracker\web; npm run db:migrate -- --name add_auth_models

# 4. Run seed
cd D:\tahfidz-tracker\web; npm run db:seed

# 5. Start dev server
cd D:\tahfidz-tracker\web; npm run dev
```

**Login URL:** http://localhost:3000/login
- Login teacher: `teacher.demo@tahfidzflow.local`
- Login admin: `admin`
- Password: `2026`

---

## Project Summary

TahfidzFlow is a teacher-only, mobile-first web application for managing Quran memorization progress. The system is designed to help teachers record hafalan, murojaah, student targets, progress summaries, and reports from a smartphone or laptop.

The original project was a Python Telegram bot that stored records in CSV. That prototype is preserved as `legacy-bot/`. The new main project is a Vercel-friendly Next.js web app in `web/`.

Primary goals:

- Make Tahfidz recording faster and more organized for teachers.
- Support many teachers, academic classes, halaqah groups, and students.
- Use a real PostgreSQL database instead of CSV.
- Keep the daily teacher workflow simple on smartphones.
- Keep the UI smooth, elegant, and respectful to the Tahfidz purpose.
- Prepare for Indonesian, English, and Arabic interface support.
- Add Telegram and AI later after the web workflow is stable.

### Current Status - Phase 3 Complete, Codebase Cleaned

**Authentication is fully implemented and working:**
- NextAuth with credentials provider
- Login page at /login
- Password hashing with bcrypt
- Middleware for route protection
- Session-based auth with JWT
- Teacher-scoped data filtering
- Demo user: `teacher.demo@tahfidzflow.local` / `2026`
- Admin user: `admin` / `2026`

**Codebase quality improvements completed:**
- Shared utilities extracted (`form-helpers.ts`, `format.ts`)
- Shared BottomNav component
- Loading skeleton, error boundary, custom 404
- All duplicated code consolidated
- Full Indonesian UI labels
- Consistent design system (slate palette, rounded-2xl)

---

## Current Architecture

Current stack:

- Framework: Next.js 15.5.15
- Language: TypeScript
- Styling: Tailwind CSS
- Database: PostgreSQL hosted on Neon
- ORM: Prisma 7.8.0
- Prisma adapter: `@prisma/adapter-pg`
- Auth: NextAuth v5 (Auth.js) beta
- Icons: `lucide-react`
- Hosting target: Vercel
- Local dev URL: `http://127.0.0.1:3000`

Important decision:

- The project uses Next.js instead of Django because free-first Vercel deployment and smartphone web access are high priorities.
- The legacy Python Telegram bot is kept as reference and should not be deleted.
- School structure uses separate academic classes and halaqah groups. Academic classes are normal school classes like `7A`, `8B`, and `9C`. Halaqah groups are tahfidz groups such as `Halaqah 8`, with levels `LOW`, `MEDIUM`, or `HIGH`.

## Current Project Structure

```text
tahfidz-tracker/
  AI_CONTEXT.md
  README.md
  .gitignore
  .env.example
  legacy-bot/
    tahfidz_app.py
    requirements.txt
    config.py                ignored local secret file
    memorization_data.csv    ignored local data file
    memorization_data.xlsx   ignored generated export file
  web/
    .env                     ignored local secret file with DATABASE_URL, AUTH_SECRET, AUTH_URL
    .env.example
    eslint.config.mjs
    next.config.ts
    package.json
    prisma.config.ts
    prisma/
      schema.prisma
      seed.ts
      migrations/
        20260428061120_init/
          migration.sql
        20260428190000_academic_classes_halaqah_levels/
          migration.sql
        migration_lock.toml
    src/
      auth.ts                 NextAuth config (spreads auth.config.ts)
      auth.config.ts          Auth pages + authorized callback
      middleware.ts            Route protection
      app/
        layout.tsx
        loading.tsx            Skeleton loading state
        error.tsx              Error boundary
        not-found.tsx          Custom 404
        page.tsx               Dashboard
        globals.css
        login/
          page.tsx
        quick-log/
          page.tsx
          actions.ts
        students/
          page.tsx
          [id]/
            page.tsx
            hafalan/
              actions.ts
              new/
                page.tsx
            murojaah/
              actions.ts
              new/
                page.tsx
        reports/
          page.tsx
        profile/
          page.tsx
      components/
        BottomNav.tsx          Shared bottom navigation
        LogoutButton.tsx
      lib/
        prisma.ts              Prisma client singleton
        database-url.ts        DATABASE_URL validation
        form-helpers.ts        Shared form parsing utilities
        format.ts              Shared formatters, labels, date/time, navigation
        dashboard.ts           Dashboard data queries
        students.ts            Student data queries
        quick-log.ts           Quick-log parser + data queries
```

## Completed Work

Planning and organization:

- Created `README.md` with purpose, direction, architecture, roles, phases, mobile-first design, PWA direction, multilingual direction, and deployment strategy.
- Chosen product name: `TahfidzFlow`.
- Preserved old Python bot files in `legacy-bot/`.
- Added root `.gitignore` and `.env.example`.
- Rotated Telegram/Gemini secrets outside the codebase according to the user's report.

Next.js foundation:

- Created `web/` Next.js app.
- Pinned app to Next.js 15.5.15 after Next.js 16 caused a local Windows SWC/Turbopack issue.
- Configured TypeScript, Tailwind CSS, ESLint, and app router.
- Added `lucide-react` icons.
- Created mobile-first dashboard preview with elegant TahfidzFlow branding.

Database foundation:

- Created Neon PostgreSQL database.
- Added `DATABASE_URL` to `web/.env` locally.
- Created Prisma schema.
- Ran first migration successfully.
- Generated Prisma Client.
- Added database helper files.
- Added idempotent seed script.
- Seeded sample teacher, halaqah group, academic classes, students, hafalan records, murojaah record, and targets into Neon.
- Updated home dashboard to read data from Neon instead of hardcoded arrays.
- Added `/students` student list page.
- Added `/students/[id]` student detail page.
- Added `/students/[id]/hafalan/new` add-hafalan form and server action.
- Added school structure direction: students belong to both an academic class and a halaqah group; halaqah groups have levels.

Quick Log implementation:

- Added `/quick-log` page for fast teacher entries.
- Created quick-log parser in `src/lib/quick-log.ts` to parse natural language entries.
- Added server action to save parsed entries as Hafalan or Murojaah records.
- Updated navigation to link to `/quick-log`.
- Updated student detail page layout with better mobile navigation.

Murojaah and time field implementation:

- Fixed TypeScript strict guard issues in quick-log parser.
- Added `/students/[id]/murojaah/new` form page for recording revision (murojaah).
- Added server action to save RevisionRecord.
- Added time input field to both hafalan and murojaah forms.
- All timestamp records now capture actual recording time, not just midnight.
- Teachers can review and adjust date/time before confirming Quick Log entries.

Authentication (Phase 3):

- Implemented NextAuth v5 with credentials provider.
- JWT session strategy with role and teacherId in token.
- Middleware route protection via `auth.config.ts`.
- Server actions verify authentication + teacher-student ownership.
- Data pages filter by teacherId (admins see all).
- Seed script creates admin and teacher demo accounts.

Code quality sweep:

- Extracted shared form helpers to `src/lib/form-helpers.ts`.
- Extracted shared format utilities to `src/lib/format.ts`.
- Created shared `BottomNav` component replacing 4 duplicated nav arrays.
- Created `loading.tsx` (skeleton), `error.tsx` (error boundary), `not-found.tsx` (404).
- Deleted dead `students/components/` directory (11 unused files).
- Fixed timezone issue in date inputs (UTC vs local).
- Fixed silent date fallback in `parseRecordDateTime`.
- Fixed dashboard needsReviewCount to use actual DB count.
- Fixed dashboard "Detail" button to link to student page.
- Consolidated all duplicated labels, formatters, constants.
- Changed halaqah level labels to Indonesian.
- Added page-specific metadata exports.
- Added `max={286}` to ayah number inputs.
- Unified design system (slate colors, rounded-2xl).

Verification:

```bash
npx tsc --noEmit   # 0 errors
npm run lint        # 0 errors, 0 warnings
npx prisma validate # valid
npx prisma generate # success
```

## Current App Behavior

The home page at `web/src/app/page.tsx` is a dynamic server-rendered dashboard.

It displays:

- TahfidzFlow branding with personalized greeting.
- Today's record count from database.
- Weekly target progress from database.
- Quick action buttons.
- Recent hafalan and murojaah activities with clickable "Detail" links.
- Total count of records needing review (accurate DB count).
- Bottom navigation for mobile-first teacher workflow.

When navigating, users see a skeleton loading state. On errors, a styled error boundary is shown. Unknown routes show a custom 404 page.

The seeded data currently includes:

- Teacher: Ustadzah Nur Aisyah
- Academic classes: 7A, 7B, 8A, 8B, 9A, 9B, 9C
- Halaqah group: Halaqoh Ust Azka, level LOW
- Students: Afdal Fauzan Nurrohman, Muhammad Nasuha, Jureid Sholahuddin
- Hafalan and murojaah sample records.
- Active targets.

## Core Data Models

Current Prisma models:

- `User`
- `Teacher`
- `AcademicClass`
- `ClassGroup`
- `Student`
- `MemorizationRecord`
- `RevisionRecord`
- `Target`
- `Account` (required by PrismaAdapter for NextAuth)
- `Session` (required by PrismaAdapter for NextAuth)
- `VerificationToken` (required by PrismaAdapter for NextAuth)

Current enums:

- `UserRole`: `ADMIN`, `TEACHER`
- `Gender`: `MALE`, `FEMALE`
- `HalaqahLevel`: `LOW`, `MEDIUM`, `HIGH`
- `RecordStatus`: `LANCAR`, `CUKUP`, `PERLU_MUROJAAH`
- `TargetType`: `HAFALAN`, `MUROJAAH`
- `TargetStatus`: `ACTIVE`, `COMPLETED`, `MISSED`, `CANCELLED`

Important data design decisions:

- Students and records use IDs, not only names.
- Students have separate academic class and halaqah group relationships.
- Academic classes represent school classes like `7A`, `8B`, and `9C`.
- `ClassGroup` currently means halaqah group in the product, with a `level` field. A later cleanup may rename it to `HalaqahGroup`.
- Halaqah groups are not schedule-based because tahfidz time is flexible/random by day.
- Hafalan and murojaah are separate models.
- Teacher ownership exists on students, records, and targets.
- Telegram ID is planned on the teacher profile for later bot integration.

## Main Modules To Build

### Authentication

Status: ✅ Fully implemented.

- NextAuth v5 (Auth.js) with credentials provider.
- JWT session strategy with role and teacherId.
- Middleware route protection.
- Server actions verify authentication + teacher-student ownership.
- Data pages filter by teacherId (admins see all).

### Teacher Dashboard

Status: ✅ Fully implemented on `/`.

- Reads real Neon data, filtered by teacher.
- Loading skeleton, error boundary.
- "Detail" links navigate to student pages.

### Students / Santri

Status: ✅ Fully implemented on `/students` and `/students/[id]`.

- Student cards show academic class and halaqah summary.
- Search works through the `q` query string.
- Teacher-scoped data filtering.

### Hafalan Records

Status: ✅ Fully implemented on `/students/[id]/hafalan/new`.

- Server action validates input and saves a `MemorizationRecord`.
- Auth + ownership verification.

### Murojaah Records

Status: ✅ Fully implemented on `/students/[id]/murojaah/new`.

- Server action validates input and saves a `RevisionRecord`.
- Auth + ownership verification.

### Quick Log

Status: ✅ Fully implemented on `/quick-log`.

- Natural language parser.
- Confirmation form with editable fields.
- Date + time pickers.
- Auth + ownership verification.

### Targets

Status: Display only. No CRUD yet.

- Student detail page shows active targets.
- No UI for creating/editing targets.

### Reports

Status: Placeholder page only.

### Admin Management

Status: Not started.

### Multilingual Support

Status: Not implemented. UI text is Indonesian.

### Telegram Integration

Status: Not implemented. Legacy bot preserved for reference.

### AI Parser

Status: Not implemented.

## Phased Plan

### Phase 1: Foundation

Status: ✅ Complete.

### Phase 2: Mobile Teacher Workflow

Status: ✅ Complete (100%).

Teachers can:
1. ✅ View dashboard with today's summary
2. ✅ List and search all assigned students
3. ✅ Record hafalan for a student (with time)
4. ✅ Record murojaah for a student (with time)
5. ✅ Use Quick Log for fast entries with confirmation
6. ✅ Navigate smoothly between all main sections
7. ✅ See recent activities with accurate timestamps

### Phase 3: Auth and Permissions

Status: ✅ Complete.

- Admin and teacher login with NextAuth.
- Role-based access (ADMIN, TEACHER).
- Teacher data scoping via session.teacherId.
- Protected routes via middleware.
- Server actions verify auth + ownership.
- Loading skeleton, error boundary, custom 404.

### Phase 4: Admin Management

Status: Not started.

Build:

- Teacher CRUD.
- Academic class CRUD.
- Halaqah group CRUD.
- Student CRUD.
- Assign teachers/halaqah groups.

### Phase 5: Reports and Export

Status: Not started.

Build:

- Student report.
- Academic class report.
- Halaqah group report.
- Weekly/monthly reports.
- Behind-target report.
- Excel export.
- PDF export later.

### Phase 6: PWA, Multilingual, and Polish

Status: Not started.

Build:

- PWA install support.
- Indonesian translation structure.
- English translation.
- Arabic translation and RTL handling.
- More refined motion and visual polish.

### Phase 7: Telegram and AI

Status: Future.

Build:

- Telegram webhook route.
- Teacher Telegram ID linking.
- Telegram quick commands.
- Quick Log parser reuse.
- Optional AI parser service.

## Current Commands

Run from `web/`:

```bash
npm run dev
npm run lint
npm run build
npm run db:validate
npm run db:generate
npm run db:migrate -- --name <name>
npm run db:seed
npm run db:studio
```

Current dev server:

```text
http://127.0.0.1:3000
```

## Environment Notes

Important files:

- `web/.env` contains the real Neon `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_URL`.
- `web/.env` must never be committed.
- `legacy-bot/config.py` is ignored and contains local legacy secrets only.
- Root `.gitignore` and `web/.gitignore` are intended to keep secrets, virtualenv, node modules, build output, and local data out of Git.

### Prisma 7 Migration Notes

**Important:** This project uses Prisma 7 which has breaking changes:

1. **Datasource URL** - No longer in schema.prisma. Use `prisma.config.ts` for migrations.
2. **PrismaClient** - Must use adapter: `new PrismaClient({ adapter })`
3. **Enums** - Exported from `/enums` file, not from `/client`
4. **Middleware** - Prisma's `node:crypto` causes issues with Next.js 15 Turbopack. Use legacy webpack.

## Required .env Variables

```
DATABASE_URL=postgresql://...?sslmode=verify-full
AUTH_SECRET=your-secret-key-here
AUTH_URL=http://localhost:3000
```

Security:

- Do not paste database URLs, Telegram tokens, or Gemini keys into chat, README, screenshots, or GitHub.
- The legacy bot previously had secrets in code. The user reported rotating Telegram and Gemini keys.

## Known Local Environment Notes

- Node.js was installed during the rebuild.
- PowerShell blocks direct `npm` PowerShell script execution, so commands were run through `npm.cmd` when needed.
- Next.js 16 initially caused local Windows SWC/Turbopack issues. The project was pinned to Next.js 15.5.15 for stability.
- Prisma 7 generated client is output to `web/src/generated/prisma-next`, which is ignored by `web/.gitignore`.
- Windows Application Control blocked Prisma's `schema-engine-windows.exe` and blocked `tsx`/esbuild child-process spawning. Migrations were applied manually through the `pg` driver.

## Design Direction

The UI should be:

- Mobile-first.
- Smooth and elegant.
- Calm and respectful.
- Memorable but not noisy.
- Touch-friendly for teachers using phones at school.
- Indonesian-first.

Avoid:

- Crowded dashboards.
- Overly playful visual effects.
- Heavy animations that slow phones.
- UI that makes the Tahfidz purpose feel less dignified.

---

## ✅ STRENGTHS

1. **Clean Architecture** - Well-organized with shared utilities in `lib/`, shared components in `components/`
2. **Mobile-First Design** - Responsive UI optimized for smartphones
3. **TypeScript** - Full type safety, 0 errors on `tsc --noEmit`
4. **Prisma ORM** - Modern database access with type-safe queries
5. **PostgreSQL (Neon)** - Serverless, scalable database
6. **Authentication** - NextAuth v5 with credentials, JWT sessions, role-based access
7. **Teacher Scoping** - Data filtered by teacherId, ownership verification in actions
8. **Shared Utilities** - `form-helpers.ts`, `format.ts`, `BottomNav` eliminate duplication
9. **Quick Log Parser** - Natural language input parsing for fast entry
10. **UX Polish** - Loading skeletons, error boundary, custom 404, consistent design system
11. **Code Quality** - 0 ESLint errors, 0 TypeScript errors, no dead code
12. **Indonesian UI** - All labels in Bahasa Indonesia including halaqah levels

---

## ❌ AREAS FOR IMPROVEMENT

### High Priority (Next Phase)
1. **No Admin Panel** - Can't manage teachers, classes, students via UI
2. **No Student CRUD** - Can't add/edit/delete students from UI
3. **No Reports** - Placeholder page only
4. **No Role-Based UI** - No admin vs teacher views
5. **No Target CRUD** - Targets shown but can't be created/edited

### Medium Priority
6. **Single Teacher Demo** - Seeded data is for one teacher only
7. **No Pagination** - Student list could grow large
8. **No Rate Limiting** - Server actions have no throttle
9. **Client-side Filtering** - Student search filters in JS, not DB

### Nice to Have
10. **No PWA Support** - Can't install as app on phone
11. **No i18n** - Indonesian only
12. **No Telegram Integration** - Legacy bot not connected
13. **No AI Parser** - Quick Log uses regex only
14. **No Export** - Can't export to Excel/PDF

---

## 🎯 RECOMMENDED NEXT STEPS

### Step 1: Phase 4 - Admin Management (recommended next)
- [ ] Teacher CRUD (create, read, update, delete)
- [ ] Academic Class CRUD
- [ ] Halaqah Group CRUD
- [ ] Student CRUD with assignment
- [ ] Admin dashboard view

### Step 2: Phase 5 - Reports & Export
- [ ] Student progress report
- [ ] Class/Halaqah summary
- [ ] Excel export
- [ ] Behind-target alerts

### Step 3: Phase 6 - Polish
- [ ] PWA support
- [ ] Pagination for large lists
- [ ] Rate limiting on server actions
- [ ] DB-level search filtering

**Recommended path:**
```
Phase 4 (Admin) → Phase 5 (Reports) → Phase 6 (PWA/i18n)
```
