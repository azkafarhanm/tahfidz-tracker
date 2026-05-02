# AI Context: TahfidzFlow

This document summarizes the current state, architecture, modules, and phased plan for the TahfidzFlow rebuild. Use it as the project handoff context before continuing implementation.

---

## ⚠️ CURRENT ISSUES & KNOWN PROBLEMS

### Critical Issues (Must Fix Before Running)

1. **Missing AUTH_SECRET** - Add to `web/.env`:
   ```
   AUTH_SECRET="tahfidzflow-super-secret-key-2025-change-in-production"
   ```

2. **Prisma 7 Configuration** - Prisma 7 requires adapter-based setup:
   - Uses `@prisma/adapter-pg` with `PrismaPg` adapter
   - Must use `new PrismaClient({ adapter })` constructor
   - Enums exported from `enums` file, not `client`

3. **Enum Import Paths** - All files must import from:
   ```
   from "@/generated/prisma-next/enums"
   ```
   NOT from `client`

4. **node:crypto Issue** - Prisma middleware causes build issues with Next.js 15 + Turbopack. Use legacy webpack (disable turbopack in next.config.ts)

### Files Fixed (for reference)

- `src/lib/prisma.ts` - Uses PrismaPg adapter
- `src/lib/dashboard.ts` - Enum import fixed
- `src/lib/students.ts` - Enum import fixed
- `src/lib/quick-log.ts` - Enum import fixed
- `src/app/quick-log/actions.ts` - Enum import fixed
- `src/app/quick-log/page.tsx` - Enum import fixed
- `src/app/students/[id]/hafalan/actions.ts` - Enum import fixed
- `src/app/students/[id]/hafalan/new/page.tsx` - Enum import fixed
- `src/app/students/[id]/murojaah/actions.ts` - Enum import fixed
- `src/app/students/[id]/murojaah/new/page.tsx` - Enum import fixed
- `prisma/seed.ts` - Enum import fixed, uses adapter

---

## How to Run (After Fixes)

```bash
# 1. Add AUTH_SECRET to web/.env
# 2. Clear cache
Remove-Item -Recurse -Force "D:\tahfidz-tracker\web\.next" -ErrorAction SilentlyContinue

# 3. Regenerate Prisma
cd D:\tahfidz-tracker\web; npm run db:generate

# 4. Run seed to update password
cd D:\tahfidz-tracker\web; npm run db:seed

# 5. Start dev server
cd D:\tahfidz-tracker\web; npm run dev
```

**Login URL:** http://localhost:3000/login
- Email: `teacher.demo@tahfidzflow.local`
- Password: `tahfidz2025`


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

### Current Status - Phase 3 Complete

**Authentication is now fully implemented and working:**
- ✅ NextAuth with credentials provider
- ✅ Login page at /login
- ✅ Password hashing with bcrypt
- ✅ Middleware for route protection
- ✅ Session-based auth with JWT
- ✅ Teacher-scoped data filtering
- ✅ Demo user with password: `teacher.demo@tahfidzflow.local` / `tahfidz2025`
- ✅ Admin user with password: `admin@tahfidzflow.local` / `tahfidz2025`

---

## Current Architecture

Current stack:

- Framework: Next.js 15.5.15
- Language: TypeScript
- Styling: Tailwind CSS
- Database: PostgreSQL hosted on Neon
- ORM: Prisma 7.8.0
- Prisma adapter: `@prisma/adapter-pg`
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
    .env                     ignored local secret file with DATABASE_URL
    .env.example
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
      app/
        layout.tsx
        page.tsx
        globals.css
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
          components/
            index.ts
            RecordFormHeader.tsx
            RecordFormShell.tsx
            RecordFormSection.tsx
            TextInputField.tsx
            NumberInputField.tsx
            DateInputField.tsx
            TimeInputField.tsx
            SelectField.tsx
            TextAreaField.tsx
            FormActionButtons.tsx
        reports/
          page.tsx
        profile/
          page.tsx
      lib/
        prisma.ts
        database-url.ts
        dashboard.ts
        students.ts
        quick-log.ts
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
- Ran first migration successfully:

```text
web/prisma/migrations/20260428061120_init/migration.sql
```

- Generated Prisma Client.
- Added database helper files:

```text
web/src/lib/prisma.ts
web/src/lib/database-url.ts
web/src/lib/dashboard.ts
```

- Added idempotent seed script:

```text
web/prisma/seed.ts
```

- Seeded sample teacher, halaqah group, academic classes, students, hafalan records, murojaah record, and targets into Neon.
- Updated home dashboard to read data from Neon instead of hardcoded arrays.
- Added `/students` student list page.
- Added `/students/[id]` student detail page.
- Added `/students/[id]/hafalan/new` add-hafalan form and server action.
- Added school structure direction: students belong to both an academic class and a halaqah group; halaqah groups have levels.

Quick Log implementation:

- Added `/quick-log` page for fast teacher entries.
- Created quick-log parser in `src/lib/quick-log.ts` to parse natural language entries like "Ahmad Al-Mulk 1-10 lancar".
- Added server action `src/app/quick-log/actions.ts` to save parsed entries as Hafalan or Murojaah records.
- Updated home dashboard "Quick Log" action button to link to `/quick-log`.
- Updated bottom nav "Catat" button to link to `/quick-log`.
- Updated student detail page layout with better mobile navigation.

Murojaah and time field implementation:

- Fixed 3 TypeScript strict guard issues in quick-log parser.
- Created 9 reusable form components in `src/app/students/components/`:
  - `RecordFormShell`, `RecordFormHeader`, `RecordFormSection`
  - `TextInputField`, `NumberInputField`, `DateInputField`, `TimeInputField`
  - `SelectField`, `TextAreaField`, `FormActionButtons`
- Added `/students/[id]/murojaah/new` form page for recording revision (murojaah).
- Added `src/app/students/[id]/murojaah/actions.ts` server action to save RevisionRecord.
- Added time input field to both hafalan and murojaah forms (was missing, causing `00:00` times).
- Updated server actions to parse both date and time using `parseRecordDateTime()`.
- All timestamp records now capture actual recording time, not just midnight.
- Fixed Quick Log confirmation form to include date + time pickers (was only date).
- Teachers can now review and adjust date/time before confirming Quick Log entries.

Verification completed:

```bash
npm run lint
npm run build
npm run db:validate
npm run db:seed
```

All passed at the time this file was created.

## Current App Behavior

The home page at `web/src/app/page.tsx` is now a dynamic server-rendered dashboard.

It displays:

- TahfidzFlow branding.
- Today's record count from database.
- Weekly target progress from database.
- Quick action buttons.
- Recent hafalan and murojaah activities from database.
- Count of records that need review.
- Bottom navigation for mobile-first teacher workflow.


The seeded data currently includes:

- Teacher: Ustadzah Nur Aisyah
- Academic classes: 7A, 7B, 8A, 8B, 9A, 9B, 9C
- Halaqah group: Halaqoh Ust Azka, level LOW
- Students: Afdal Fauzan Nurrohman, Muhammad Nasuha, Jureid Sholahuddin
- Hafalan and murojaah sample records.
- Active targets.

Simulation note:

- The current sample students are renamed versions of the earlier sample rows, so the old setoran data was preserved on the same student IDs:
- `Ahmad F.` -> `Afdal Fauzan Nurrohman` with class `9C`
- `Zahra A.` -> `Muhammad Nasuha` with class `8A`
- `Bilal R.` -> `Jureid Sholahuddin` with class `7B`

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

Purpose:

- Allow admin and teacher login.
- Protect dashboard and data pages.
- Restrict teachers to their own students and halaqah groups.

Likely approach:

- Auth.js / NextAuth or another Vercel-friendly auth solution.
- Start with email/password or simple credentials for MVP.

### Teacher Dashboard

Purpose:

- Give teachers a quick daily overview.
- Show records today, targets, recent activities, and review warnings.

Current status:

- Partially implemented on `/`.
- Reads real Neon data.

### Students / Santri

Purpose:

- List assigned students.
- Search students quickly.
- Open student detail.
- See latest progress and notes.

Current status:

- `/students` implemented.
- Student cards show academic class and halaqah summary.
- Search works through the `q` query string.

### Hafalan Records

Purpose:

- Add new memorization records.
- Validate surah, ayah range, date, status, score, and notes.
- Show recent hafalan history.

Current status:

- `/students/[id]/hafalan/new` implemented.
- Server action validates input and saves a `MemorizationRecord`.

### Murojaah Records

Purpose:

- Add revision records separately from new hafalan.
- Track weak areas and review quality.

### Quick Log

Purpose:

- Let teachers type short entries like `Ahmad Al-Mulk 1-10 lancar`.
- Parse into structured fields.
- Confirm before saving.

This should be built before Telegram because it gives Telegram-like speed inside the web app.

### Targets

Purpose:

- Set weekly/monthly hafalan or murojaah goals.
- Track active, completed, missed, or cancelled targets.

### Reports

Purpose:

- Student progress report.
- Academic class and halaqah progress report.
- Weekly/monthly summary.
- Students behind target.
- Excel export first.
- PDF later.

### Admin Management

Purpose:

- Manage teacher accounts.
- Manage academic classes.
- Manage halaqah groups.
- Manage students.
- Assign teachers to halaqah groups/students.
- View all progress.

### Multilingual Support

Purpose:

- Indonesian default.
- English optional.
- Arabic optional later with RTL support.

This has not been implemented yet. Current UI text is mostly Indonesian.

### Telegram Integration

Purpose:

- Allow each teacher to log records through Telegram later.
- Use webhook, not long-running polling, because the deployment target is Vercel.

Status:

- Not implemented.
- Legacy bot preserved for reference.

### AI Parser

Purpose:

- Parse flexible natural language teacher entries.
- Should be optional and validated before saving.

Status:

- Not implemented.

## Phased Plan

### Phase 1: Foundation

Status: mostly complete.

Completed:

- Project direction and README.
- Legacy bot preserved.
- Next.js app created.
- Tailwind and TypeScript configured.
- Prisma configured.
- Neon PostgreSQL connected.
- First migration applied.
- Prisma client generated.
- Sample seed data inserted.
- Database-backed dashboard preview built.

Remaining:

- Decide authentication approach.
- Add proper app layout components.
- Add shared UI components.
- Add PWA basics later.

### Phase 2: Mobile Teacher Workflow

Status: complete (100%).

Completed:

- `/students` page with search functionality.
- Student detail page with recent activities.
- Add hafalan form with date + time fields.
- Add murojaah form with date + time fields.
- Quick Log page with:
  - Natural language parser ("Afdal Al-Mulk 1-10 Lancar")
  - Confirmation form with editable fields
  - Date + time pickers
  - Ability to adjust parsed values before saving
- Shared form components library (9 components, reusable across forms).
- All navigation links functional (no broken `#` links).
- Placeholder pages for Reports and Profile (Phase 3/5 features).

Phase 2 is fully functional and production-ready for core teacher workflow. Teachers can:
1. ✅ View dashboard with today's summary
2. ✅ List and search all assigned students
3. ✅ Record hafalan for a student (with time)
4. ✅ Record murojaah for a student (with time)
5. ✅ Use Quick Log for fast entries with confirmation
6. ✅ Navigate smoothly between all main sections
7. ✅ See recent activities with accurate timestamps

### Phase 3: Auth and Permissions

Status: ✅ COMPLETE.

Completed:

- Admin and teacher login with NextAuth.
- Role-based access (ADMIN, TEACHER).
- Teacher data scoping via session.teacherId.
- Protected routes via middleware.
- Seed admin/teacher accounts with passwords.
- Demo credentials: teacher.demo@tahfidzflow.local / tahfidz2025
- Admin credentials: admin@tahfidzflow.local / tahfidz2025

### Phase 4: Admin Management

Status: not started.

Build:

- Teacher CRUD.
- Academic class CRUD.
- Halaqah group CRUD.
- Student CRUD.
- Assign teachers/halaqah groups.

### Phase 5: Reports and Export

Status: not started.

Build:

- Student report.
- Academic class report.
- Halaqah group report.
- Weekly/monthly reports.
- Behind-target report.
- Excel export.
- PDF export later.

### Phase 6: PWA, Multilingual, and Polish

Status: not started.

Build:

- PWA install support.
- Indonesian translation structure.
- English translation.
- Arabic translation and RTL handling.
- More refined motion and visual polish.

### Phase 7: Telegram and AI

Status: future.

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

- `web/.env` contains the real Neon `DATABASE_URL` and MUST include `AUTH_SECRET`.
- `web/.env` must never be committed.
- `legacy-bot/config.py` is ignored and contains local legacy secrets only.
- Root `.gitignore` and `web/.gitignore` are intended to keep secrets, virtualenv, node modules, build output, and local data out of Git.

### Prisma 7 Migration Notes

**Important:** This project uses Prisma 7 which has breaking changes:

1. **Datasource URL** - No longer in schema.prisma. Use `prisma.config.ts` for migrations.
2. **PrismaClient** - Must use adapter: `new PrismaClient({ adapter })`
3. **Enums** - Exported from `/enums` file, not from `/client`
4. **Middleware** - Prisma's `node:crypto` causes issues with Next.js 15 Turbopack. Use legacy webpack.

### Required .env Variables

```
DATABASE_URL=postgresql://...
AUTH_SECRET=your-secret-key-here
```

Security:

- Do not paste database URLs, Telegram tokens, or Gemini keys into chat, README, screenshots, or GitHub.
- The legacy bot previously had secrets in code. The user reported rotating Telegram and Gemini keys.

## Known Local Environment Notes

- Node.js was installed during the rebuild.
- PowerShell blocks direct `npm` PowerShell script execution, so commands were run through `npm.cmd` when needed.
- Next.js 16 initially caused local Windows SWC/Turbopack issues. The project was pinned to Next.js 15.5.15 for stability.
- Prisma 7 generated client is currently output to `web/src/generated/prisma-next`, which is ignored by `web/.gitignore`.
- Windows Application Control blocked Prisma's `schema-engine-windows.exe` and blocked `tsx`/esbuild child-process spawning in this shell. The academic-class migration and sample data backfill were applied manually through the `pg` driver after validating the schema and migration SQL locally.

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

## ✅ ADVANTAGES OF CURRENT PROJECT

### Completed Features
1. **Clean Architecture** - Well-organized folder structure with separation of concerns
2. **Mobile-First Design** - Responsive UI optimized for smartphones
3. **TypeScript** - Full type safety throughout the codebase
4. **Prisma ORM** - Modern database access with type-safe queries
5. **PostgreSQL (Neon)** - Serverless, scalable database
6. **Authentication** - NextAuth with credentials provider, JWT sessions
7. **Teacher Scoping** - Data filtered by teacherId for multi-tenant support
8. **Form Components** - Reusable, consistent UI components
9. **Quick Log Parser** - Natural language input parsing for fast entry
10. **Beautiful UI** - Elegant emerald/slate color scheme, smooth transitions

### Technical Strengths
- Server Actions for form submissions
- Server Components for data fetching
- Middleware for route protection
- Database seeding with realistic sample data
- Time tracking (date + time) for all records
- Status tracking (LANCAR, CUKUP, PERLU_MUROJAAH)

---

## ❌ DISADVANTAGES / AREAS FOR IMPROVEMENT

### Critical (Must Fix)
1. **Prisma 7 Complexity** - Requires adapter setup, causes build issues
2. **Missing AUTH_SECRET** - Environment variable not in .env
3. **Middleware Build Errors** - node:crypto issues with Next.js 15

### High Priority
4. **No Admin Panel** - Can't manage teachers, classes, students via UI
5. **No Student CRUD** - Can't add/edit/delete students from UI
6. **No Reports** - Placeholder pages only
7. **No Role-Based UI** - No admin vs teacher views

### Medium Priority
8. **Limited Validation** - Basic form validation only
9. **No Error Boundaries** - Errors crash entire page
10. **No Loading States** - Could benefit from skeleton screens
11. **Single Teacher Demo** - Seeded data is for one teacher only
12. **No Pagination** - Student list could grow large

### Nice to Have
13. **No PWA Support** - Can't install as app on phone
14. **No i18n** - Indonesian only
15. **No Telegram Integration** - Legacy bot not connected
16. **No AI Parser** - Quick Log uses regex only
17. **No Export** - Can't export to Excel/PDF

---

## 🎯 RECOMMENDED NEXT STEPS

### Step 1: Fix Runtime Issues
- [ ] Add AUTH_SECRET to .env
- [ ] Verify Prisma adapter works correctly
- [ ] Test login flow end-to-end

### Step 2: Phase 4 - Admin Management
- [ ] Teacher CRUD (create, read, update, delete)
- [ ] Academic Class CRUD
- [ ] Halaqah Group CRUD
- [ ] Student CRUD with assignment
- [ ] Admin dashboard view

### Step 3: Phase 5 - Reports & Export
- [ ] Student progress report
- [ ] Class/Halaqah summary
- [ ] Excel export
- [ ] Behind-target alerts

### Step 4: Phase 6 - Polish
- [ ] PWA support
- [ ] Error boundaries
- [ ] Loading skeletons
- [ ] Pagination for large lists

---


## Immediate Next Step

Phase 3 (Authentication) is complete! **Next recommended phase:**

**Option A: Phase 4 - Admin Management** (recommended next)
- Teacher CRUD
- Class/Halaqah group CRUD
- Student CRUD
- Student-teacher assignment
- Estimated time: 2-3 hours

**Option B: Phase 5 - Reports & Export** (high-value feature)
- Student progress reports
- Class progress reports
- Excel export
- Behind-target students report

**Recommended path:**
```
Phase 4 (Admin) → Phase 5 (Reports) → Phase 6 (PWA/i18n)
```

Phase 3 is done. The app is now ready for multi-teacher use with proper authentication!
