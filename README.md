# TahfidzFlow

TahfidzFlow is planned as a teacher-only, mobile-first web application for recording and monitoring students' Quran memorization progress. The project helps teachers manage daily hafalan, murojaah, student targets, progress reports, and exports in a simple and practical way.

The current version is a useful Python Telegram bot prototype with CSV storage. The rebuild direction is to turn it into a Vercel-friendly web application that can be used by many teachers from a smartphone or laptop.

## Project Purpose

The purpose of this project is to make Tahfidz recording easier, faster, and more organized for teachers.

The system should help teachers:

- Record new memorization progress.
- Record murojaah or revision progress.
- Manage students, academic classes, and halaqah groups.
- Set weekly or monthly targets.
- See students who are behind target.
- View student and class progress.
- Export reports to Excel and later PDF.
- Use the app comfortably from a smartphone.
- Use Telegram later as an optional quick logging channel.

Students do not need accounts in the first rebuild. Teachers are responsible for listening, checking, and recording the memorization result.

## Final Rebuild Direction

The final foundation is:

- Framework: Next.js
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Frontend: Tailwind CSS
- Hosting: Vercel
- Database hosting: Neon or Supabase
- Authentication: Auth.js / NextAuth, or another Vercel-friendly auth solution
- Reports: Excel first, PDF later
- App style: Mobile-first web app / PWA
- Telegram Bot: added later using webhook
- AI Parser: optional later for natural language input
- Languages: Indonesian default, English and Arabic optional

This direction is chosen because the project should be useful for many people, easy to access, practical on smartphones, and deployable with a free-first Vercel workflow.

## Why Not Django First

Python Django is powerful and still a good framework, but it is not the smoothest choice for a free Vercel-first deployment. Django is better when the project has backend hosting such as a VPS, Render, Railway, or another always-running server.

For this project, free and practical deployment is important. Next.js fits Vercel better, so it is the better foundation for the rebuild.

The old Python bot should not be deleted. It should be preserved as a legacy prototype and can guide the future Telegram integration.

## Target Users

The system should focus on teacher and admin users only.

### Admin

Admin users manage the whole system.

Admin responsibilities:

- Create and manage teacher accounts.
- Create and manage academic classes and halaqah groups.
- Manage student data.
- Assign teachers to halaqah groups or students.
- View school-wide reports.
- Export reports.
- Correct data when needed.

### Teacher

Teacher users manage their assigned students and halaqah groups.

Teacher responsibilities:

- View assigned halaqah groups.
- View assigned students.
- Add hafalan records.
- Add murojaah records.
- Edit incorrect records.
- Set student targets.
- View progress reports.
- Export reports for their own students or halaqah groups.
- Use a smartphone-friendly dashboard at school.
- Use Telegram later for quick daily logging.

## School Structure Direction

TahfidzFlow should model the real school structure clearly instead of using one generic class field for every grouping.

Students have two separate contexts:

- Academic class: the normal school class such as `7A`, `7B`, `8A`, `9C`.
- Halaqah group: the tahfidz grouping handled by a teacher, such as `Halaqah 8`.

Halaqah groups are not schedule-based because tahfidz time can change from day to day. Names like `Halaqah Pagi` or `Halaqah Sore` should not be used as core data. Instead, each halaqah group has a level:

- `LOW`
- `MEDIUM`
- `HIGH`

Example:

```text
Student: Zahra A.
Academic class: 8B
Halaqah group: Halaqah 8
Halaqah level: LOW
Teacher: Ustadzah Nur Aisyah
```

The current Prisma model name `ClassGroup` is used for halaqah groups for now to avoid a large rename during active development. In UI and documentation, it should be treated as a halaqah group. A later cleanup can rename `ClassGroup` to `HalaqahGroup`.

## Mobile-First Direction

The main device target is smartphone. Laptop support is still important, especially for admins, but the daily teacher workflow should work well on a phone.

Mobile-first rules:

- Use bottom navigation for teacher screens.
- Use large touch-friendly buttons.
- Keep forms short and focused.
- Make student search fast.
- Put the most common actions on the home screen.
- Avoid crowded tables on small screens.
- Use cards or compact lists for mobile records.
- Keep the interface simple enough for use during school activity.

Important mobile screens:

- Home
- Students
- Add Hafalan
- Add Murojaah
- Quick Log
- Reports
- Profile / Settings

## Visual Design Direction

The interface should feel smooth, modern, elegant, and memorable, but still respectful to the purpose of a Tahfidz system. The design should attract attention without turning the app into something noisy, playful, or unrelated to Quran memorization.

Design goals:

- Elegant and calm first impression.
- Smooth transitions between pages and actions.
- Subtle live animation for important states.
- Clear visual hierarchy for teacher workflows.
- Strong mobile readability.
- Professional dashboard feeling.
- Respectful Islamic education atmosphere.

Animation should support the workflow, not distract from it.

Good animation examples:

- Smooth page transitions.
- Gentle loading states.
- Subtle progress movement.
- Soft hover and tap feedback.
- Animated progress ring or progress bar.
- Small confirmation animation after saving a record.
- Calm dashboard micro-interactions.

Avoid:

- Overly playful effects.
- Loud colors that reduce readability.
- Heavy animation that makes the app slow on phones.
- Decorative visuals that make the Tahfidz purpose feel less serious.
- Crowded dashboard screens.

The visual identity should balance beauty and dignity: modern enough to catch attention, simple enough for daily teacher use, and respectful enough for a Quran memorization management system.

## PWA Direction

The app should be prepared as a Progressive Web App.

PWA benefits:

- Teachers can open the app from a browser.
- Teachers can add the app to the phone home screen.
- The app can feel closer to a normal mobile app.
- No Play Store installation is needed.
- The same system still works on laptop.

The first version does not need advanced offline features. The first goal is a clean mobile web app that can be installed to the home screen.

## Language Direction

The main language of the system should be Indonesian because the primary users are expected to understand Indonesian. English and Arabic should be added as optional interface languages.

Language priority:

- Indonesian: default and primary language.
- English: optional language for wider understanding and documentation.
- Arabic: optional language for Quran-related context and future users who prefer Arabic labels.

Important language rules:

- Default dashboard language should be Indonesian.
- Buttons, menus, forms, validation messages, and report labels should be translatable.
- Quran terms such as surah, ayah, juz, hafalan, and murojaah should be handled consistently.
- Arabic support should consider right-to-left layout needs later.
- The first version can focus on Indonesian, but the code structure should make English and Arabic easier to add.

## Current Project Strengths

The current prototype already proves that the idea is useful.

- Teachers can log memorization quickly through Telegram.
- The app already supports add, view, edit, delete, stats, and export.
- Natural language input is useful for fast daily recording.
- Excel export is already part of the workflow.
- The project already has a real Tahfidz-focused purpose.

## Current Project Weaknesses

The current version is useful as a prototype, but not strong enough for many teachers.

- Data is stored in CSV, which is fragile for multi-user use.
- Secrets are stored directly in `config.py`.
- Most logic is inside one large Python file.
- Authorization only supports a simple Telegram user ID approach.
- Records use student names instead of real student IDs.
- Edit and delete actions can affect the wrong record if students have the same name.
- There is no proper teacher, class, or student data model.
- There is no role-based dashboard.
- Murojaah is not separated strongly enough from new memorization.
- Reporting is limited for class, teacher, weekly, and monthly analysis.
- The current bot does not provide a full visual dashboard for smartphone use.

## Target System Description

TahfidzFlow should become a teacher-only, multilingual, mobile-first Tahfidz management web app. Teachers can record students' new memorization and murojaah, manage targets, monitor progress, and export reports. Admins can manage teachers, academic classes, halaqah groups, students, assignments, and school-wide reporting.

The main system should be the web dashboard. Telegram should be added later as a quick input helper, not as the main system.

Example teacher workflow:

1. Teacher opens the web app from phone.
2. Teacher logs in.
3. Teacher opens an assigned halaqah group or searches a student.
4. Teacher selects or searches a student.
5. Teacher adds hafalan or murojaah record.
6. Teacher checks progress and target status.
7. Teacher exports a report when needed.

Example Quick Log workflow:

1. Teacher opens Quick Log.
2. Teacher types a short entry such as `Ahmad Al-Mulk 1-10 lancar`.
3. System parses the text into student, surah, ayah range, and notes.
4. Teacher confirms the result.
5. Record is saved to the database.

Example future Telegram workflow:

1. Teacher connects Telegram account.
2. Teacher sends a quick message to the bot.
3. Bot checks the teacher's Telegram ID.
4. System validates the student, academic class, and halaqah group.
5. Record is saved into the same database used by the web dashboard.

## Recommended Project Structure

The old Python bot should be kept safely while the new web app is built.

Recommended structure:

```text
tahfidz-tracker/
  README.md
  .gitignore
  .env.example
  legacy-bot/
    tahfidz_app.py
    config.py                local only, ignored because it contains secrets
    requirements.txt
    memorization_data.csv    local only, ignored because it contains app data
    memorization_data.xlsx   local only, ignored because it is generated export data
  web/
    Next.js app
```

The `legacy-bot` folder keeps the current prototype. The `web` folder becomes the new main project.

## Core Data Models

The rebuild should start with simple but clear data models.

### User

Stores login information and role.

Important fields:

- Name
- Email
- Password or auth provider data
- Role
- Active status

### Teacher

Stores teacher profile information.

Important fields:

- User account
- Full name
- Telegram user ID
- Phone number
- Active status

### Academic Class

Stores the normal school class identity.

Important fields:

- Grade
- Section
- Name, such as `7A`, `8B`, `9C`
- Academic year
- Active status

### Halaqah Group

Stores the tahfidz group handled by a teacher. The current Prisma model name is `ClassGroup`, but the product meaning is halaqah group.

Important fields:

- Halaqah name, such as `Halaqah 8`
- Teacher
- Level: `LOW`, `MEDIUM`, or `HIGH`
- Description
- Active status

### Student

Stores student profile information.

Important fields:

- Full name
- Academic class
- Halaqah group
- Gender
- Join date
- Active status
- Notes

### Memorization Record

Stores new memorization progress.

Important fields:

- Student
- Teacher
- Surah
- From ayah
- To ayah
- Date
- Status
- Score
- Notes

### Revision Record

Stores murojaah or revision progress.

Important fields:

- Student
- Teacher
- Surah
- From ayah
- To ayah
- Date
- Score
- Notes

### Target

Stores student memorization or revision goals.

Important fields:

- Student
- Teacher
- Target type
- Surah
- From ayah
- To ayah
- Start date
- End date
- Status

## MVP Scope

The first version should be small, useful, and easy to test on phone.

MVP features:

- Teacher login.
- Admin login.
- Mobile-first teacher home screen.
- Elegant visual design foundation.
- Smooth animation and interaction foundation.
- Student list.
- Student search.
- Add hafalan form.
- Add murojaah form.
- Quick Log page.
- Basic student progress page.
- Basic class progress page.
- Basic Excel export.
- Indonesian interface as default.
- Translation structure prepared for English and Arabic.

Features not included in the first version:

- Telegram bot.
- AI parser.
- PDF export.
- Advanced charts.
- Parent/student accounts.
- Offline mode.

These features can be added later after the core workflow is stable.

## Rebuild Phases

### Phase 1: Project Foundation ✅ COMPLETE

Result: Clean Vercel-friendly Next.js app with TypeScript, Tailwind CSS, Prisma 7, Neon PostgreSQL, seed data.

### Phase 2: Mobile Teacher Dashboard ✅ COMPLETE

Result: Teacher dashboard, student list/detail, hafalan/murojaah forms, Quick Log (guided flow), bottom navigation, mobile-first design.

### Phase 3: Auth & Permissions ✅ COMPLETE

Result: NextAuth v5 with credentials, JWT sessions, ADMIN/TEACHER roles, middleware protection, teacher-scoped data filtering.

### Phase 4: Admin Management ✅ COMPLETE

Result: Admin dashboard, teacher CRUD, academic class CRUD, halaqah group CRUD, student CRUD with assignments, admin student detail.

### Phase 5: Reports & Export ✅ COMPLETE

Result: Teacher/admin/student reports, Excel export (exceljs), PDF export (pdfkit), progress tracking with score badges and history tables.

### Phase 6: Edit & Polish ✅ ~95% COMPLETE

Result: Edit student/records, deactivate/reactivate students, delete teacher, change password, guided Quick Log, format improvements.

### Phase 7: Target Management ❌ NEXT

Goal: Full CRUD for hafalan/murojaah targets with progress tracking.

Tasks:

- [ ] Create target form (surah, ayah range, deadline, type)
- [ ] Edit target
- [ ] Cancel/complete target
- [ ] Progress percentage tracking
- [ ] Behind-target alerts
- [ ] Target overview on dashboard

### Phase 8: Notifications & UX Polish ❌ PLANNED

Goal: Production-ready UX polish.

Tasks:

- [ ] Toast notifications for success/error
- [ ] Better loading states
- [ ] Pagination for large lists
- [ ] PWA install support
- [ ] Rate limiting on server actions
- [ ] Responsive tweaks

### Phase 9: Telegram Integration — FUTURE

- [ ] Telegram webhook route
- [ ] Teacher Telegram ID linking
- [ ] Quick commands

### Phase 10: AI Parser — FUTURE

- [ ] AI parsing service module
- [ ] Fallback parsing when AI unavailable

### Phase 11: Multilingual & PWA — FUTURE

- [ ] Indonesian (default), English, Arabic
- [ ] RTL layout for Arabic
- [ ] PWA offline support

## First Milestone

The first rebuild milestone should be small and useful.

Milestone scope:

- Preserve current Python bot in `legacy-bot`.
- Create Next.js app in `web`.
- Configure TypeScript.
- Configure Tailwind CSS.
- Configure Prisma.
- Connect PostgreSQL.
- Create basic auth structure.
- Create admin and teacher roles.
- Create teacher model.
- Create class model.
- Create student model.
- Create memorization record model.
- Create mobile-first teacher dashboard.
- Create elegant UI foundation.
- Add basic smooth interaction patterns.
- Create basic hafalan form.
- Create Quick Log page.
- Use Indonesian as the default interface language.
- Prepare translation structure for English and Arabic.

This milestone is enough to replace the fragile CSV prototype with a stronger foundation.

## Deployment Direction

The project should be designed for a Vercel-first workflow.

Deployment plan:

- Deploy the Next.js web app to Vercel.
- Use PostgreSQL from Neon or Supabase.
- Store secrets in Vercel environment variables.
- Do not use local SQLite in production.
- Do not depend on local file storage for important production data.
- Use webhook-based integrations for Telegram later.

This makes the project easier to share with teachers through a normal link and easier to test from a smartphone.

## Database Setup

The web app should use PostgreSQL. For a Vercel-first workflow, the recommended database provider is Neon or Supabase.

Recommended first choice:

- Neon PostgreSQL

Local setup flow:

1. Create a PostgreSQL project in Neon.
2. Copy the database connection string.
3. Save it locally in `web/.env` or `web/.env.local` as `DATABASE_URL`.
4. Do not commit the real database URL.
5. Run the first migration from the `web` folder.

Useful commands:

```bash
npm run db:validate
npm run db:migrate -- --name init
npm run db:generate
npm run db:studio
```

The database URL contains a password, so it should never be pasted into chat, screenshots, README files, or GitHub.

## Important Rules for the Rebuild

- Build the mobile-first web dashboard first.
- Keep Telegram as a later integration.
- Keep the old Python bot as `legacy-bot`.
- Store data in PostgreSQL, not CSV.
- Use IDs for students and records, not only names.
- Separate new memorization from murojaah.
- Keep secrets in environment variables.
- Use Indonesian as the default interface language.
- Prepare all interface text for translation.
- Keep the first version simple but well-structured.
- Add AI only after the normal workflow works.
- Design every main teacher flow for smartphone use.
- Make the UI beautiful, smooth, and memorable without reducing the dignity of the Tahfidz purpose.

## Current Project Status — ~90% Complete

The project has completed Phases 1–8 and is production-ready. Remaining phases are future enhancements.

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Foundation (Next.js, Prisma, DB, seed) | ✅ Complete |
| 2 | Mobile Teacher Workflow (dashboard, students, hafalan, murojaah, quick-log) | ✅ Complete |
| 3 | Auth & Permissions (NextAuth, roles, middleware) | ✅ Complete |
| 4 | Admin Management (teacher/class/halaqah/student CRUD) | ✅ Complete |
| 5 | Reports & Export (Excel, PDF, progress tracking) | ✅ Complete |
| 6 | Edit & Polish (edit/delete records, deactivate/reactivate, change password, delete teacher) | ✅ ~95% |
| 7 | Target Management (CRUD targets, progress bar, complete/cancel) | ✅ Complete |
| 8 | UX Polish (toast notifications, loading skeletons) | ✅ Complete |

### What Works Now

- **Teacher workflow**: Login → dashboard → view students → record hafalan/murojaah → set targets → view progress → export reports
- **Admin workflow**: Login → manage teachers/classes/halaqahs/students → view all reports → export data
- **Target Management**: Create/edit/cancel/complete targets with progress bars and overdue tracking
- **Quick Log**: Guided structured input (search student → pick surah/ayah → submit)
- **Reports**: Excel + PDF export for teacher, admin, and per-student views
- **Edit/Delete**: Edit student data, edit/delete records, deactivate/reactivate students, delete teachers (admin), change password
- **Toast Notifications**: Success/error feedback on all actions via sonner
- **Auth**: NextAuth v5 with JWT, role-based access, teacher-scoped data

### Demo Accounts

- Admin: `admin` / `2026`
- Teacher 1: `teacher.demo@tahfidzflow.local` / `2026`
- Teacher 2: `teacher.salwa@tahfidzflow.local` / `2026`

The best version of this project is a teacher-only, mobile-first Tahfidz management system with a Vercel-deployed web dashboard as the core and Telegram as a future quick logging helper.

This direction is stronger than a Telegram-only bot because it supports better data structure, safer permissions, easier editing, clearer reports, smartphone use, and many teachers using the system at the same time.
