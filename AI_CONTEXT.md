# AI Context: TahfidzFlow

Updated: 2026-05-10

This file is the current handoff context for the TahfidzFlow codebase.

## Snapshot

- Core usable product: about 90% complete
- Full roadmap: about 80% complete

Why this is the current estimate:

- Teacher workflow is already strong and usable day to day.
- Auth, role checks, admin CRUD, reports, targets, and exports already exist.
- Multilingual support exists, but still needs one more cleanup pass for action-generated messages and a few runtime edge cases.
- Telegram integration and AI parsing are still future work.

## Phase Estimate

| Area | Status |
| --- | --- |
| Foundation | 100% |
| Teacher workflow | 100% |
| Auth and permissions | 100% |
| Admin management | 90% |
| Reports and export | 85% |
| UX, PWA, and polish | 80% |
| Multilingual consistency | 70% |
| Telegram integration | 0% |
| AI parser | 0% |

## What the App Already Does

### Teacher side

- Login with credentials
- Dashboard with summary cards and recent activity
- Student list and student detail
- Add hafalan
- Add murojaah
- Quick Log flow
- Edit student data
- Edit and delete records
- Create, edit, cancel, and complete targets
- View overdue targets
- Export reports

### Admin side

- Admin dashboard
- Teacher CRUD
- Academic class CRUD
- Halaqah CRUD
- Student CRUD
- Admin student detail
- Admin reports

### Platform features

- NextAuth / Auth.js credentials auth
- Role-based access control
- Teacher-scoped data filtering
- PWA install prompt
- Surah autocomplete with 114 surahs
- Juz helper utilities
- PDF and Excel export routes
- Locale files for Indonesian, English, and Arabic

## Current Business Rules

- `AcademicClass` is the school class, such as `7A`, `7B`, `8A`, `9C`.
- `ClassGroup` is the current Prisma model name for halaqah in the product UI.
- One teacher can have one halaqah per grade per academic year.
- The schema enforces this with `@@unique([teacherId, academicYear, grade])`.
- Students from different sections can still belong to the same halaqah if they share the same grade.
- `Student` belongs to:
  - one `Teacher`
  - one `ClassGroup` / halaqah
  - optional `AcademicClass`
- Halaqah levels are `LOW`, `MEDIUM`, and `HIGH`.
- Record statuses are `LANCAR`, `CUKUP`, and `PERLU_MUROJAAH`.

## Current Auth and Demo Accounts

- Admin alias: `admin`
- Admin real email: `admin@tahfidzflow.local`
- Teacher demo 1: `teacher.demo@tahfidzflow.local`
- Teacher demo 2: `teacher.salwa@tahfidzflow.local`
- Demo password for seeded accounts: `2026`

## Current Stack

- Next.js `15.5.15`
- React `19`
- TypeScript `5`
- Tailwind CSS `4`
- Prisma `7.8.0`
- PostgreSQL
- `@prisma/adapter-pg`
- NextAuth `5 beta`
- `next-intl`
- `exceljs`
- `pdfkit`
- `sonner`
- `lucide-react`
- Vercel deployment target

## Important Technical Notes

- The repo root has a wrapper `package.json` that forwards commands into `web/`.
- The real Next.js app lives in `web/`.
- Vercel must use `web` as the Root Directory.
- Prisma client output is generated into `web/src/generated/prisma-next`.
- Enum imports should use `@/generated/prisma-next/enums`.
- The auth API route is forced to Node.js runtime.
- PDF export uses PDFKit, not full Puppeteer rendering.

## Project Shape

High-value directories and files:

- `web/src/app`
  - all routes and pages
- `web/src/app/admin`
  - admin dashboard and CRUD modules
- `web/src/app/students`
  - teacher-side student flow
- `web/src/app/quick-log`
  - quick logging flow
- `web/src/app/api/reports`
  - Excel and PDF exports
- `web/src/components`
  - shared UI like sidebar, bottom nav, surah input, logout, install prompt
- `web/src/lib`
  - data queries, auth helpers, formatting, PDF helpers, reports
- `web/src/i18n/request.ts`
  - locale loading
- `web/prisma/schema.prisma`
  - current DB schema
- `web/prisma/seed.ts`
  - demo data

## Commands

Run from the repo root:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run verify:fast
npm run verify
npm run db:generate
npm run db:validate
npm run db:deploy
npm run db:seed
```

Direct `web/` commands still work too:

```bash
cd web
npm run dev
npm run db:migrate -- --name your_change_name
```

## Environment Variables

Required for the web app:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="replace-me"
NEXTAUTH_URL="http://localhost:3000"
APP_DEFAULT_LOCALE="id"
```

Future-only placeholders:

```env
TELEGRAM_BOT_TOKEN=""
GEMINI_API_KEY=""
```

## Known Gaps and Risks

- Some success and error messages coming from server actions are still hardcoded in Indonesian.
- Multilingual page UI is in place, but deep consistency still needs one more pass.
- PDF routes may still need Vercel runtime verification if production shows `500`.
- The project does not yet have automated test coverage.
- Telegram integration is not started.
- AI parser is not started.

## Recommended Next Steps

1. Finish multilingual consistency for server-action messages and query-string banners.
2. Push the latest local UI polish changes that are still only in the workspace.
3. Re-test PDF export on Vercel and inspect Function Logs if any route still returns `500`.
4. Add a small CI flow for `lint`, `typecheck`, and `build`.
5. Only after the web workflow is fully stable, continue to Telegram and AI parser work.

## Practical Summary

TahfidzFlow is no longer just an early prototype. It is already a real teacher/admin web app with the main operational flow working. The remaining work is mostly consistency, deployment polish, and future integrations rather than missing core CRUD foundations.
