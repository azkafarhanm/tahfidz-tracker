# Changelog

All notable changes to **TahfidzFlow** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Navigation & Scroll Persistence and workflow persistence across primary and
detail navigation. Not yet released to production users.

### Added — Navigation & Scroll Persistence

- **Scroll position persistence** across primary navigation (sidebar and bottom
  nav). Scroll position is saved synchronously on click and restored via
  `useLayoutEffect` before the browser paints, eliminating the visible flash.
- **Navigation context persistence** — search queries, filter selections, and
  pagination state survive round-trip navigation (e.g., Students → Dashboard →
  Students restores the previous search and page).
- **Live search stability** — `LiveSearchForm` refactored with debounced input,
  URL-synced query parameters, and stable re-render behavior across navigation
  cycles.
- **Assessment and admin list persistence** — context persistence extended to
  Formative, Summative, and all admin list pages (Teachers, Classes, Halaqah,
  Students).
- **Desktop and Android PWA verification** — all persistence behaviors verified
  on both desktop browser and installed Android PWA.

### Added — Phase 3A Workflow Persistence

- **Context-aware workflow return links** reuse Navigation Context Persistence
  and Scroll Persistence for frequent list → detail → Back workflows.
- **Students → Student Detail → Back** now restores the originating search,
  pagination, program, active/inactive tab, and scroll position.
- **Formative → Student Detail → Back** now restores semester, class level,
  program, pagination, reports origin when present, and scroll position.
- **Summative → Student Detail → Back** now restores the equivalent assessment
  context and scroll position.
- **Canonical workflow context restoration** prevents implicit default filters
  from producing mismatched scroll-storage identities.

### Added — Phase 3B Workflow Persistence

#### Candidate 1

- **Edited record is revealed after Save.** Teacher → Student Detail → Edit
  Memorization/Revision Record → Save now returns to the edited record with the
  row scrolled into view and highlighted, instead of landing at the top of the
  activity table. Reuses the existing `highlight` machinery already used by the
  create flow.

#### Candidate 2

- **Admin Students workflow persistence.** The Admin Students → Edit → Save/Back
  workflow now preserves the originating directory context.
- Preserved search, pagination, program type, and scroll after editing.
- Added edited-student highlight after successful save.
- Preserved detail-origin navigation when editing from Admin Student Detail.

#### Candidate 3

- **Admin Teachers workflow persistence.** The Admin Teachers directory now
  preserves search, pagination, and scroll across Edit to Save/Cancel.
- Added edited-teacher highlight after successful save.

#### Teacher module closeout

- **Teacher workflow persistence finalized.** Teacher Dashboard, Students,
  Student Detail, Quick Log, Formative, Summative, and record-entry flows now
  preserve the teacher's working context across detail, edit, save, cancel, and
  browser back/forward navigation.
- **Program-aware Teacher workspace state.** Academic and Boarding student-list
  searches, pages, and active/inactive tabs are isolated so switching programs
  no longer leaks the previous program's search or pagination state.
- **Server-action return restoration.** Teacher edit forms arm scroll
  restoration before server redirects, allowing Save to return to the correct
  detail position without adding a second navigation.
- **Quick Log record highlight.** Newly created Quick Log records now return
  the created record id, expand recent activity, and briefly highlight the new
  row before linking onward to Student Detail.
- **Responsive Teacher polish.** Student Detail quick actions, dashboard
  shortcuts, action buttons, and Teacher-facing helper text were adjusted to
  preserve readable labels across small mobile widths without changing desktop
  behavior.

### Fixed

- Preserved sidebar scroll position across navigation for both Admin and Teacher.
- Prevented unnecessary sidebar auto-scrolling when the active navigation item
  was already visible.
- **Route loading is less jarring during App Router transitions.** Teacher,
  Admin, profile, login, reports, formative, and summative loading routes now
  use shared route-transition skeleton primitives with a short delayed reveal,
  reducing skeleton flash on fast transitions while keeping long data loads
  visible.
- **Admin data loading is more resilient to transient database timeouts.** Admin
  dashboard and directory loaders now avoid bursty parallel Prisma reads on the
  affected paths, and the Prisma retry classifier recognizes Neon connection
  timeout terminations as transient.

- **ProgramType remains active during live search** on Teacher Students and the
  Admin Students, Classes, and Halaqah pages. Search URLs now retain the selected
  Academic or Boarding program while continuing to reset pagination.

- **Record edit forms now default to current device date/time.** Previously,
  `DeviceDateTimeFields` ignored the `initialDateTimeIso` prop on edit pages,
  causing forms to initialize with the current time even when editing an older
  record. The component now correctly initializes from the prop when provided,
  and falls back to the current device time only for new records.
- **Student activity timestamps are consistent after editing.** The Tasmi edit
  action was using `parseDateInput` (date-only, midnight UTC) instead of
  `parseRecordDateTime` (date + time + timezone), discarding the time component.
  Fixed to use `parseRecordDateTime`, matching the Hafalan/Murojaah edit flow.
- **Summative assessment timestamps are editable.** Summative forms now include
  date and time fields and persist `createdAt` during create/update, matching
  the rest of the Teacher record-entry workflow.
- **Teacher detail returns retain program context.** Student Detail edit,
  Hafalan, Murojaah, Tasmi, Target, dashboard target, and recent activity links
  now carry `programType` through cancel, validation failure, save, and delete
  paths.
- **Search reset keeps the Teacher workspace.** Resetting Students search now
  preserves the active page, tab, program, dashboard shortcut, and profile return
  context instead of falling back to a bare `/students` URL.
- **Dashboard target queries scoped to active Academic Year.** The
  `overdueTargets` and `weeklyCompletedTargets` queries were not filtering by
  `academicYear`, causing targets from previous years to appear on the Dashboard
  while the Student Detail page correctly rejected them (404). Fixed by adding
  `student.classGroup.academicYear` filter to both queries.
- **Fixed loss of search query after Admin Student edit.** The server action now
  rebuilds the directory redirect URL from hidden form inputs (`directoryQ`,
  `directoryPage`) mirroring the existing `programType` pattern, so a server
  redirect no longer drops the active search filter.
- **Fixed loss of pagination after Admin Student edit.** The directory page
  number is round-tripped through the edit form and re-applied on Save.

### Changed

- **Removed redundant delete action from Tasmi edit page.** The Tasmi edit form
  previously included an inline delete button, duplicating the delete action
  available on the Student Detail page. Removed to simplify the edit flow and
  reduce accidental deletions.

### Internal

- **`RouteTransitionSkeleton` component** - shared route-loading skeleton
  primitives for app chrome, admin chrome, bare profile forms, dashboards,
  directories, details, forms, and tables.
- **Delayed skeleton reveal CSS** - `route-transition-skeleton` waits briefly
  before appearing so fast navigations do not show an avoidable loading flash.
- **`usePanelScrollRestoration` hook** — core scroll persistence logic using
  `sessionStorage`, pathname-based keys, whitelist gating, and synchronous save
  in the click handler. Uses `useLayoutEffect` for flicker-free restore.
- **`useNavigationContext` hook** — persists search/filter/pagination state in
  `sessionStorage` per pathname, enabling context restoration on back-navigation.
- **`ScrollRestoration` component** — mounted once in the root layout, delegates
  to `usePanelScrollRestoration`.
- **`LiveSearchForm` component** — refactored with debounced input, URL sync,
  and stable re-render behavior.
- **Persistence architecture documentation** added to `docs/`.

### Tech stack (unchanged from v1.0.0)

Next.js 15.5 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 ·
Prisma 7.8 (`@prisma/adapter-pg`) · PostgreSQL (Neon) · NextAuth 5 ·
Upstash Redis · next-intl · exceljs · pdfkit · lucide-react · sonner · next-themes.

---

## [1.0.0] — 2026-07-01

See [`release/v1.0.0/CHANGELOG.md`](release/v1.0.0/CHANGELOG.md) for the full
v1.0.0 release notes.

[Unreleased]: https://github.com/azkafarhanm/tahfidz-tracker/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/azkafarhanm/tahfidz-tracker/releases/tag/v1.0.0
