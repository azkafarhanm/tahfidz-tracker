# TahfidzFlow

TahfidzFlow is a mobile-first web app for managing Quran memorization activity for teachers and admins. It covers daily hafalan and murojaah recording, student management, halaqah management, targets, reports, and exports.

The legacy Telegram bot prototype is still kept in `legacy-bot/`. The main active app is the Next.js project in `web/`.

## Current Status

- Core usable product: about 90% complete
- Full roadmap: about 80% complete

What that means in practice:

- Teacher daily workflow is already usable.
- Admin CRUD and reporting are mostly in place.
- Multilingual support exists, but still needs one more consistency pass.
- Telegram integration and AI parsing are still future work.

## Main Features

### Teacher workflow

- Login with credentials
- Dashboard
- Student list and student detail
- Add hafalan
- Add murojaah
- Quick Log flow
- Edit student data
- Edit and delete records
- Target CRUD
- Overdue target tracking
- Teacher reports

### Admin workflow

- Admin dashboard
- Teacher CRUD
- Academic class CRUD
- Halaqah CRUD
- Student CRUD
- Admin student detail
- Admin reports

### Platform features

- Role-based auth with NextAuth / Auth.js
- Teacher-scoped data access
- Excel export
- PDF export routes
- PWA install prompt
- Surah autocomplete with 114 surahs
- Locale files for Indonesian, English, and Arabic

## Current School Model

- `AcademicClass` = school class such as `7A`, `7B`, `8A`, `9C`
- `ClassGroup` = current Prisma model name for halaqah in the UI
- A teacher currently has one halaqah per grade per academic year
- Students can come from different sections inside the same grade halaqah

Example:

- Student home class: `7B`
- Teacher halaqah: `Kelas 7`
- Academic year: `2025/2026`

## Demo Accounts

- Admin: `admin`
- Admin email: `admin@tahfidzflow.local`
- Teacher 1: `teacher.demo@tahfidzflow.local`
- Teacher 2: `teacher.salwa@tahfidzflow.local`
- Password: `2026`

## Tech Stack

- Next.js 15.5.15
- React 19
- TypeScript 5
- Tailwind CSS 4
- Prisma 7
- PostgreSQL
- `@prisma/adapter-pg`
- NextAuth 5 beta
- `next-intl`
- `exceljs`
- `pdfkit`
- `sonner`

## Project Structure

```text
tahfidz-tracker/
  AI_CONTEXT.md
  README.md
  legacy-bot/
  web/
    prisma/
    src/
      app/
      components/
      i18n/
      lib/
```

Important note:

- The real web app lives in `web/`.
- The root `package.json` is only a command wrapper for convenience.

## Local Setup

1. Install dependencies.
2. Prepare environment variables.
3. Generate Prisma client.
4. Seed the database.
5. Start the dev server.

### Environment

Copy `.env.example` or `web/.env.example` into a real local env file and fill it:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="replace-me"
NEXTAUTH_URL="http://localhost:3000"
APP_DEFAULT_LOCALE="id"
```

### Run From Repo Root

```bash
npm install
npm run db:generate
npm run db:seed
npm run dev
```

Open:

```text
http://localhost:3000/login
```

## Useful Commands

From the repo root:

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

If you need local Prisma migrations during development:

```bash
cd web
npm run db:migrate -- --name your_change_name
```

## Verification

Fast verification:

```bash
npm run verify:fast
```

Full verification:

```bash
npm run verify
```

## Deployment Notes

For Vercel:

- Root Directory must be `web`
- Framework Preset should be `Next.js`
- Required env vars:
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `NEXTAUTH_URL`

If the deployment shows `404`, the first thing to check is almost always the Root Directory.

If a PDF route shows `500`, check the Vercel Function Logs for the exact runtime error.

## Current Known Gaps

- Some server-action success and error messages are still hardcoded in Indonesian.
- Multilingual support is present, but not yet fully polished in every edge case.
- PDF export should still be verified carefully in Vercel runtime.
- Telegram integration is not started.
- AI parser is not started.
- There is no automated test suite yet.

## Recommended Next Steps

1. Finish multilingual consistency for server-action banners and validation feedback.
2. Re-check PDF export on Vercel.
3. Add CI for `lint`, `typecheck`, and `build`.
4. Continue deployment polish.
5. Start Telegram integration only after the web app is fully stable.

## Legacy Bot

The Python Telegram prototype still exists in:

```text
legacy-bot/
```

It is kept for reference and possible future Telegram integration. The main production direction is the web app in `web/`.
