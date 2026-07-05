# Changelog

All notable changes to **TahfidzFlow** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-07-05

### Summary

Post-release quality and UX milestone. This release delivers **Navigation &
Scroll Persistence** — a cross-cutting improvement that preserves scroll
position, search context, and filter state across primary navigation on both
Desktop and Android PWA. It also resolves timestamp consistency issues in record
edit forms and removes redundant UI from the Tasmi edit page.

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

### Fixed

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
- **Dashboard target queries scoped to active Academic Year.** The
  `overdueTargets` and `weeklyCompletedTargets` queries were not filtering by
  `academicYear`, causing targets from previous years to appear on the Dashboard
  while the Student Detail page correctly rejected them (404). Fixed by adding
  `student.classGroup.academicYear` filter to both queries.

### Changed

- **Removed redundant delete action from Tasmi edit page.** The Tasmi edit form
  previously included an inline delete button, duplicating the delete action
  available on the Student Detail page. Removed to simplify the edit flow and
  reduce accidental deletions.

### Internal

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

[1.1.0]: https://github.com/azkafarhanm/tahfidz-tracker/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/azkafarhanm/tahfidz-tracker/releases/tag/v1.0.0
