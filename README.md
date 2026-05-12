# TahfidzFlow

Mobile-first hafalan & murojaah tracking system for SMP (grades 7-9) Quran memorization programs. Built for teachers and admins to record, track, and export student progress.

**Status: Production-ready core (about 92% overall)**

## Features

### Teacher Workflow
- Dashboard with today's stats, weekly progress, overdue targets
- Student list with search, latest hafalan/murojaah, and review status
- Quick Log guided flow for fast record entry
- Create/edit/delete hafalan and murojaah records
- Formative recap generated automatically from daily records
- Flexible summative assessment per student and per surah
- Student detail with full history and score tracking
- Target management with progress bars and overdue indicators
- Edit student data, deactivate/reactivate students
- Teacher reports with Excel and PDF export
- Dedicated formative and summative Excel exports

### Admin Workflow
- Admin dashboard with system-wide statistics
- Teacher CRUD with account management
- Academic class CRUD (7A, 7B, 8A, etc.)
- Halaqah (class group) CRUD with teacher assignment
- Student CRUD with cross-teacher management
- Admin reports with system-wide Excel and PDF export
- Deletion guards (prevent deleting teachers with students/halaqah)

### Platform
- **PWA** — installable on mobile, offline banner, service worker caching
- **i18n** — full Indonesian, English, Arabic support with RTL
- **Dark mode** — system-aware theme toggle
- **Desktop sidebar** — responsive layout with fixed sidebar on desktop
- **Security** — IDOR protection, role-based auth, orphan prevention
- **Performance** — 30s server cache, dynamic imports, font optimization
- **Export isolation** — PDF/Excel always in Indonesian regardless of UI language
- **Surah autocomplete** — all 114 surahs with juz auto-calculation
- **Animated motivation** — 70+ Quran verses with typewriter effect

## Demo Accounts

| Role | Login | Password |
|---|---|---|
| Admin | `admin` | `2026` |
| Teacher 1 | `teacher.demo@tahfidzflow.local` | `2026` |
| Teacher 2 | `teacher.salwa@tahfidzflow.local` | `2026` |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5.15 (App Router, Server Components) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | NextAuth 5 (JWT strategy) |
| i18n | next-intl (3 locales: id, en, ar) |
| Export | exceljs (Excel), pdfkit (PDF) |
| PWA | Service Worker, manifest.json |
| Icons | lucide-react |
| Toast | sonner |
| Theme | next-themes |
| Deployment | Vercel |

## Project Structure

```
tahfidz-tracker/
├── AI_CONTEXT.md          # AI session context
├── README.md
├── web/                   # Main Next.js app
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── public/
│   │   ├── sw.js          # Service worker
│   │   ├── manifest.json  # PWA manifest
│   │   └── *.png          # PWA icons
│   ├── messages/
│   │   ├── id.json        # Indonesian (39 namespaces)
│   │   ├── en.json        # English
│   │   └── ar.json        # Arabic
│   └── src/
│       ├── app/           # Next.js App Router pages
│       │   ├── admin/     # Admin routes
│       │   ├── students/  # Teacher student routes
│       │   ├── formative/ # Formative recap routes
│       │   ├── summative/ # Flexible summative routes
│       │   ├── api/       # Export/PDF API routes
│       │   └── ...
│       ├── components/    # Shared React components
│       ├── i18n/          # next-intl config
│       ├── lib/           # Business logic & data access
│       └── generated/     # Prisma generated client
└── legacy-bot/            # Old Telegram bot (deprecated)
```

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon account)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp web/.env.example web/.env
# Edit web/.env with your DATABASE_URL and AUTH_SECRET

# 3. Generate Prisma client
npm run db:generate

# 4. Seed demo data
npm run db:seed

# 5. Start dev server
npm run dev
```

Open http://localhost:3000/login

### Environment Variables

```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=verify-full"
AUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |
| `npm run verify` | Full verification (lint + typecheck + build) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## Deployment (Vercel)

1. Connect repo to Vercel
2. Set **Root Directory** to `web`
3. Framework preset: `Next.js`
4. Add environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
5. Deploy

## Data Model

```
User ─── Teacher ─── ClassGroup (halaqah)
                     │
                     └── Student ─── MemorizationRecord
                                 ─── RevisionRecord
                                 ─── Target
                                 ─── SummativeScore ─── Surah

AcademicClass (e.g., 7A, 8B, 9C)
```

- **User** — auth account (ADMIN or TEACHER role)
- **Teacher** — linked to User, owns halaqah groups
- **ClassGroup** — halaqah per teacher per grade per year
- **Student** — belongs to one Teacher and one ClassGroup
- **MemorizationRecord** — daily hafalan entry, also formative source
- **RevisionRecord** — daily murojaah entry, also formative source
- **Target** — memorization goal with deadline
- **AcademicClass** — school class (7A, 7B, etc.)
- **SummativeScore** — flexible per-surah summative assessment per semester
- **Surah / TargetSurah** — surah master + target recommendations, not rigid grading columns

## Security

- JWT-based auth with server-side session validation
- IDOR protection on all record operations
- Role-based access (teacher-scoped vs admin-scoped)
- Orphan prevention (can't delete teacher with students/halaqah)
- Student active check before class deactivation

## Performance

- 30s in-memory server cache on all read-heavy queries
- Cache invalidation on every mutation
- Dynamic imports for heavy components (FloatingSurahs, MotivationCard, Toaster)
- Font optimization (2 families, weight 400 only)
- 8 composite database indexes
- Service worker caching for static assets

## Internationalization

Three fully-supported locales with 39 namespaces each:
- 🇮🇩 **Indonesian** (default)
- 🇬🇧 **English**
- 🇸🇦 **Arabic** (with RTL support)

All server validation messages, UI labels, and error pages are translated. Exports (PDF/Excel) always output in Indonesian per institutional requirement.

## License

Private project. All rights reserved.
