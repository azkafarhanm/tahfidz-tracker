# AI Context: TahfidzFlow

This document summarizes the current state, architecture, modules, and phased plan for the TahfidzFlow rebuild. Use it as the project handoff context before continuing implementation.

---

## Current Status — ~75% Complete (Phases 1-6 Done)

### Completed Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Foundation (Next.js, Prisma, DB, seed) | ✅ 100% |
| 2 | Mobile Teacher Workflow (dashboard, students, hafalan, murojaah, quick-log) | ✅ 100% |
| 3 | Auth & Permissions (NextAuth, roles, middleware) | ✅ 100% |
| 4 | Admin Management (teacher/class/halaqah/student CRUD) | ✅ 100% |
| 5 | Reports & Export (Excel, PDF, progress tracking) | ✅ 100% |
| 6 | Edit & Polish (edit/delete records, deactivate/reactivate students, change password, delete teacher) | ✅ ~95% |

### Remaining Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 7 | Target Management (CRUD for hafalan/murojaah targets, progress %) | ❌ 0% |
| 8 | Notifications & UX Polish (loading states, toasts, PWA) | ❌ 0% |

---

## Constraints & Preferences

- Mobile-first, Indonesian-first UI with calm/respectful Tahfidz design
- Next.js 15.5.15 pinned (Next.js 16 breaks on Windows SWC/Turbopack)
- Prisma 7 with `@prisma/adapter-pg` adapter pattern, enums from `@/generated/prisma-next/enums`
- All enum imports must use `from "@/generated/prisma-next/enums"`, never from `/client`
- Legacy webpack only (Turbopack disabled due to `node:crypto` issues)
- Password for all demo accounts is `2026`
- Admin login alias is `admin` (maps to `admin@tahfidzflow.local`)
- Teacher logins: `teacher.demo@tahfidzflow.local`, `teacher.salwa@tahfidzflow.local`
- Halaqah level labels intentionally kept English: `Low/Medium/High`
- SMP only — grades restricted to 7, 8, 9 (not 10-12)
- Halaqah auto-create names follow pattern: `"Teacher Name - Kelas X"` (level shown separately in parentheses)
- Puppeteer NOT usable on Vercel — use PDFKit instead for PDF generation
- Lucide icon components cannot be passed as props from Server to Client Components — use string keys + `iconMap` lookup inside client components

---

## How to Run

```bash
# 1. Clear cache
Remove-Item -Recurse -Force "D:\tahfidz-tracker\web\.next" -ErrorAction SilentlyContinue

# 2. Regenerate Prisma
cd D:\tahfidz-tracker\web; npm run db:generate

# 3. Run migration if your local database is behind the current schema
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
- PDF: `pdfkit`
- Excel: `exceljs`
- Hosting target: Vercel
- Local dev URL: `http://127.0.0.1:3000`

---

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
        api/
          auth/
            [...nextauth]/
              route.ts         NextAuth route forced to Node.js runtime
          reports/
            export-teacher/    Excel export (exceljs)
            export-admin/      Excel export admin
            export-student/    Excel export per student
            pdf-teacher/       PDF export (pdfkit)
            pdf-admin/         PDF export admin
            pdf-student/       PDF export per student
        login/
          page.tsx
        quick-log/
          page.tsx
          GuidedQuickLog.tsx   Guided client component (search → select → structured form)
          actions.ts           createGuidedRecord server action
        students/
          page.tsx             Student list + inactive students section
          actions.ts           createTeacherStudent with grade + auto-create halaqah
          new/
            StudentForm.tsx    Student form with Kelas (7/8/9) + Level cards
            page.tsx
          [id]/
            page.tsx           Student detail with edit/export/deactivate
            edit/
              EditStudentForm.tsx
              actions.ts       updateStudent, deactivateStudent, reactivateTeacherStudent
            DeactivateButton.tsx
            hafalan/
              actions.ts
              new/
                page.tsx
            murojaah/
              actions.ts
              new/
                page.tsx
            records/
              [recordType]/
                [recordId]/
                  edit/
                    page.tsx     Edit record (hafalan/murojaah)
                    DeleteRecordButton.tsx
        reports/
          page.tsx             Teacher report page with Excel/PDF buttons
        profile/
          page.tsx             Profile page with success banner
          change-password/
            page.tsx           Change password form
            actions.ts         changePassword server action
        admin/
          page.tsx             Admin dashboard
          teachers/
            page.tsx           Teacher directory
            TeacherForm.tsx    Shared teacher form
            actions.ts         createTeacher, updateTeacher, toggleTeacherActive, deleteTeacher
            new/
              page.tsx
            [id]/
              edit/
                page.tsx       Edit teacher + delete section
                DeleteTeacherButton.tsx
          classes/
            page.tsx
            actions.ts
            new/page.tsx
            [id]/edit/page.tsx
          halaqah/
            page.tsx
            actions.ts
            new/page.tsx
            [id]/edit/page.tsx
          students/
            page.tsx           Admin student directory with clickable names
            StudentForm.tsx
            actions.ts
            new/page.tsx
            [id]/
              page.tsx         Admin student detail with full history
              edit/page.tsx    Admin edit student
          reports/
            page.tsx           Admin report page
      components/
        BottomNav.tsx          Shared bottom navigation
        LogoutButton.tsx
        ReactivateStudentButton.tsx
      lib/
        prisma.ts              Prisma client singleton
        database-url.ts        DATABASE_URL validation
        form-helpers.ts        Shared form parsing utilities
        format.ts              Shared formatters, labels, date/time, navigation
        session.ts             Shared auth/session scope helper
        dashboard.ts           Dashboard data queries
        students.ts            Student data queries, getInactiveStudentsData
        quick-log.ts           Quick-log parser (legacy, no longer used by page)
        admin.ts               All admin data queries
        reports.ts             Teacher/admin/student report queries
        records.ts             Single record data fetch (hafalan or murojaah)
        record-actions.ts      Shared updateRecord, deleteRecord server actions
        pdf.ts                 PDFKit-based PDF generation
```

---

## Completed Work

### Phase 1: Foundation — Complete

- Next.js app with TypeScript, Tailwind CSS, ESLint
- Prisma 7 with Neon PostgreSQL
- Seed script with demo data (2 teachers, halaqahs, students, records)
- Mobile-first dashboard

### Phase 2: Mobile Teacher Workflow — Complete

- Teacher dashboard with today's summary, recent activities
- Student list with search, hafalan/murojaah summaries, target count
- Student detail with full history table, targets, score badges
- Add hafalan/murojaah forms with surah/ayah pickers
- Quick Log (guided flow): search student → structured form → submit
- Bottom navigation

### Phase 3: Auth & Permissions — Complete

- NextAuth v5 with credentials provider
- JWT session with role (ADMIN/TEACHER) and teacherId
- Middleware route protection
- Teacher-scoped data filtering
- Server actions verify auth + ownership

### Phase 4: Admin Management — Complete

- Admin dashboard with system overview
- Teacher CRUD (create, edit, activate/deactivate, delete)
- Academic Class CRUD
- Halaqah Group CRUD
- Student CRUD with teacher/class/halaqah assignment
- Admin student detail with full history

### Phase 5: Reports & Export — Complete

- Teacher report: halaqah summary, student progress table, avg score, needs review count
- Admin report: all teachers/students overview
- Student progress detail with full history + targets + score badges
- Excel export (exceljs): colored headers, multiple sheets, yellow highlights for needs-review
- PDF export (pdfkit): tables, stat cards, footer timestamp
- Export buttons on all report and detail pages

### Phase 6: Edit & Polish — ~95% Complete

- Edit student (teacher + admin) with pre-filled forms
- Deactivate/reactivate students with 2-step confirmation
- Inactive students section on `/students` page
- Edit/delete records (hafalan & murojaah) with pre-filled forms + delete confirmation
- Edit record button (pencil icon) on each activity row
- Quick Log refactored from NLP to guided structured flow
- "Kelas" field (7/8/9) on teacher add-student form
- Auto-create halaqah with grade + duplicate check
- `formatClassSummary` shows `"AcademicClass · HalaqahName (Level)"`
- Admin student list: clickable student names
- Admin dashboard: "Laporan" card
- Delete teacher account (admin) with student-count safety check
- Change password page at `/profile/change-password`
- Profile page: "Ubah Password" button + success banner

### Bug Fix Sweeps

**Sweep 1 (15 fixes):** AUTH_SECRET, Prisma models, auth checks, teacher-student ownership, score display, race condition, overlapping nav, SSL, bcryptjs types, progress animation, AUTH_URL, TypeScript errors, ESLint, SSL mode

**Sweep 2 (28 fixes):** Timezone date input, silent date fallback, dashboard needsReviewCount, dead components, shared utilities (form-helpers, format, session), BottomNav, loading skeleton, error boundary, custom 404, dead code, no-op database-url, profile text, halaqah labels, LogoutButton styling, nav links, React keys, max ayah, page metadata, bracket notation, edge runtime, admin login alias, demo password, login placeholders, shared session guard

---

## Core Data Models

Current Prisma models:

- `User` — login, role, isActive
- `Teacher` — profile linked to User, fullName, phone, isActive
- `AcademicClass` — school class (7A, 8B, etc.), grade, section, academicYear
- `ClassGroup` — halaqah group, teacher, level (LOW/MEDIUM/HIGH), grade, academicYear
- `Student` — fullName, gender, joinDate, isActive, notes, linked to teacher, academicClass, classGroup
- `MemorizationRecord` — hafalan record (surah, ayah range, status, score, date)
- `RevisionRecord` — murojaah record (surah, ayah range, score, date)
- `Target` — student goal (type, surah, ayah range, dates, status)
- `Account`, `Session`, `VerificationToken` — NextAuth PrismaAdapter

Current enums:

- `UserRole`: `ADMIN`, `TEACHER`
- `Gender`: `MALE`, `FEMALE`
- `HalaqahLevel`: `LOW`, `MEDIUM`, `HIGH`
- `RecordStatus`: `LANCAR`, `CUKUP`, `PERLU_MUROJAAH`
- `TargetType`: `HAFALAN`, `MUROJAAH`
- `TargetStatus`: `ACTIVE`, `COMPLETED`, `MISSED`, `CANCELLED`

---

## Key Design Decisions

- Students use IDs, not only names
- Students have separate academic class and halaqah group relationships
- `ClassGroup` = halaqah group in product (may rename later)
- Hafalan and murojaah are separate models
- Teacher ownership on students, records, and targets
- Puppeteer replaced with PDFKit for Vercel compatibility
- Quick Log moved from NLP parsing to guided structured input
- Grade pool fixed to [7, 8, 9] (SMP only)
- Auto-create halaqah finds existing by `(teacherId, grade)` not `(teacherId, grade, level)`
- Record actions (`updateRecord`, `deleteRecord`) in `@/lib/record-actions.ts` for shared access from deeply nested routes
- Delete teacher checks student count before allowing deletion
- Change password requires current password verification

---

## Verification

```bash
npx tsc --noEmit   # 0 errors
npx next build     # 0 errors, 0 warnings
npx prisma validate # valid
```

---

## Recommended Next Steps

### Phase 7: Target Management
- [ ] Create target form (set surah, ayah range, deadline)
- [ ] Edit target
- [ ] Cancel/complete target
- [ ] Target progress tracking (percentage, behind-target alerts)
- [ ] Target overview on dashboard

### Phase 8: Notifications & UX Polish
- [ ] Toast notifications for success/error feedback
- [ ] Better loading states
- [ ] Pagination for large lists
- [ ] PWA install support
- [ ] Responsive tweaks
- [ ] Rate limiting on server actions

### Future
- [ ] Telegram integration (webhook)
- [ ] AI parser for Quick Log
- [ ] Multilingual (English, Arabic)
- [ ] PWA offline support

---

## Environment Notes

Required `.env` variables in `web/.env`:

```
DATABASE_URL=postgresql://...?sslmode=verify-full
AUTH_SECRET=your-secret-key-here
AUTH_URL=http://localhost:3000
```

- `web/.env` must never be committed
- `legacy-bot/config.py` is ignored and contains local legacy secrets only
- Root `.gitignore` and `web/.gitignore` keep secrets, node_modules, build output out of Git

### Prisma 7 Migration Notes

1. **Datasource URL** — No longer in schema.prisma. Use `prisma.config.ts` for migrations.
2. **PrismaClient** — Must use adapter: `new PrismaClient({ adapter })`
3. **Enums** — Exported from `/enums` file, not from `/client`
4. **Middleware** — Prisma's `node:crypto` causes issues with Next.js 15 Turbopack. Use legacy webpack.

---

## Known Local Environment Notes

- Node.js was installed during the rebuild.
- PowerShell blocks direct `npm` PowerShell script execution.
- Next.js 16 caused local Windows SWC/Turbopack issues. Project pinned to Next.js 15.5.15.
- Prisma 7 generated client output to `web/src/generated/prisma-next`, ignored by `.gitignore`.
- Windows Application Control blocked Prisma engines and `tsx` child-process spawning.

---

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

## Current Commands

Run from `web/`:

```bash
npm run dev
npm run lint
npm run typecheck
npm run verify
npm run build
npm run db:validate
npm run db:generate
npm run db:migrate -- --name <name>
npm run db:seed
npm run db:studio
```
