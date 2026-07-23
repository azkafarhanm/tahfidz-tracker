# Changelog

All notable changes to **TahfidzFlow** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Improved — Surah Picker Toggle

- The shared Surah input trigger now toggles its result list open and closed on
  repeated clicks or taps. Typing, keyboard navigation, option selection, and
  Smart Default behavior are unchanged.
- The first click or tap now opens the result list in the same interaction as
  input focus instead of requiring a second trigger interaction.

### Fixed — Surah Picker Native Scroll Chaining

- Removed manual touch and wheel interception from the shared Surah result list.
  Android Chrome/PWA can now natively chain the same gesture to the page at both
  the top and bottom list boundaries without changing one-time initial
  positioning, Smart Default, or filtering.

### Fixed — Responsive Layout Hardening

- Hardened shared badges, chips, statistics, summary cards, and action controls so
  they shrink or wrap within their parent instead of crossing card boundaries.
- Made theme, language, student-status, and linked segmented controls respect the
  available width on iPhone and small Android viewports.
- Improved dense student cards and activity/target metadata rows so badges and
  actions remain contained while desktop layouts retain their existing shape.

### Improved — Teacher Daily UX

- Quick Log now shares the Hafalan/Murojaah Juz + Surah smart-default priority and refreshes the material independently when teachers switch record type, for both Academic and Boarding.
- Academic Meeting History now starts fully collapsed and remembers each student's independently opened/closed months for the current browser session; highlighted meetings remain revealable.
- Hafalan and Murojaah create forms now prefill only Juz and Surah from the student's latest same-type record, with a same-type session preference fallback when no record exists. Edit forms retain their current material and also update the session preference.
- Surah picker results use native touch panning and momentum scrolling so mobile gestures remain with the list until its scroll boundary.
- Surah pickers now open the complete current-Juz list around the checked selection instead of filtering by a Smart Default or existing value; filtering begins only when the teacher types.
- Initial Surah positioning now runs exactly once when the dropdown opens; subsequent mouse, trackpad, and touch scrolling is never repositioned by hover or highlight changes.

### Added — Academic Meeting Status

- Added one daily `HADIR`, `IZIN`, `SAKIT`, or `ALFA` meeting status per Academic student, with an always-optional note.
- Added Academic Student Detail Meeting History that remains valid without activity and summarizes same-day Hafalan/Murojaah when present.
- Added database uniqueness and server-side Academic/ownership guards. Boarding, dashboard, reports, and Excel/PDF exports are unchanged.
- Polished Academic Student Detail with exact-today status metadata, compact active-semester status totals, and activity counts in each meeting timeline entry.
- Refined attendance statistics to follow the configured active Academic Year and semester, using a bounded database aggregation independent from the 50-row timeline limit.
- Grouped Academic Meeting History by month with independently collapsible native sections; the newest month opens by default and highlighted older meetings remain revealable.
- Integrated Academic Quick Log with an optional create-once status step: missing statuses can be recorded before activity entry, existing statuses remain read-only metadata, and newly recorded Izin/Sakit/Alfa suppress activity inputs. Boarding behavior is unchanged.

## [1.1.1] — 2026-07-14

### Improved — Teacher Record Entry

- **Faster Surah selection.** Hafalan, Murojaah, Quick Log, and Target forms now
  provide a Juz filter so teachers can narrow the Surah list before making a
  selection.
- **Easier Surah search.** Surah names can be found using more natural searches,
  including searches without spaces or hyphens and commonly used name variations.
- **Improved Target entry.** Target creation and editing now use the same Juz
  filter and improved Surah search as daily record-entry forms.
- **Existing selections remain safe when editing.** A previously selected Surah
  remains available when editing, even when it falls outside the currently
  selected Juz filter.

### Fixed

- **More stable Ayat input.** Ayat fields now accept digits consistently and
  avoid accidental changes caused by native number-field controls.
- **Consistent input across teacher workflows.** Hafalan, Murojaah, Quick Log,
  record editing, and Target forms now share the same Surah and Ayat input
  behavior.

## [1.1.0] — 2026-07-14

Navigation and workflow persistence, program-specific report exports, automatic
Academic Formative meeting timelines, in-app release notes, and release
operations completed after v1.0.0 and included in this release.

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

### Added — Formative Meeting Settings

- **Official per-semester Academic meeting timeline.** Admin → Tahun Ajaran
  stores the date of Pertemuan 1. After that, each new date with at least one
  Academic Formative record automatically becomes the next meeting; days with
  no Academic Formative activity do not create timeline entries.
- **Reset remains the only manual meeting control.** Reset deletes the current
  semester timeline and recreates Pertemuan 1 using the date selected by the
  administrator. The previous manual counter and “advance meeting” workflow
  were removed.
- **One shared source of truth for all Academic classes.** Classes 7, 8, and 9
  use the same stored semester timeline. Scores remain mapped to the official
  meeting date, and a student without a record on that date keeps an empty cell
  instead of having later scores shifted left.
- **Dated Academic Formative Excel headers.** Each existing meeting column now
  includes its short official date, for example `Pertemuan 2 (13 Jul)`, using a
  compact vertical header without adding columns. Boarding and PDF exports are
  unchanged.

### Added — In-App Release Notes

- **What’s New after login.** The Dashboard opens the latest published release
  note that the current user has not read. Acknowledging it stores a per-user
  read marker so the same release does not open automatically again.
- **Release history remains accessible.** The Dashboard “What’s New” action can
  reopen the latest published note even after it has been acknowledged.
- **HTML Teacher Guide link.** Release notes open the Teacher Guide in a new tab
  so the Dashboard and current application state remain available.

### Changed — Program-Specific Report Exports

- **Boarding Formative Excel** now uses grade-based progress sheets for classes
  7, 8, and 9, including Hafalan/Murojaah setoran totals, progress, and latest
  setoran information.
- **Boarding Summative Excel** now uses an Info sheet and grade sheets with
  per-student Surah/Nilai blocks and latest-assessment summaries.
- **Teacher PDF export** keeps Academic and Boarding sections separate. Academic
  data is grouped by grade and parallel class; Boarding data remains grouped by
  grade.
- **Institutional exports omit Halaqah Level.** Halaqah name and class context
  remain available without exposing the internal level field.
- **Teacher report export refinements** reuse the canonical Academic/Boarding
  workbook helpers and program-aware sheet prefixes across standalone and
  combined exports.

### Changed — Summative Bulk Workflow

- **Curriculum-guided bulk entry.** Teachers can save multiple target scores in
  one submission. Boarding uses grade-specific targets; Academic also supports
  additional memorization entries.
- **Multi-highlight after save.** Every changed Summative row is returned through
  the plural `highlights` query and revealed on the student detail page, while
  single-record edit flows continue using `highlight`.
- **“Latest Assessment” follows the final submitted input.** Bulk payload parsing
  preserves the original form order across target, choice, and additional score
  fields. Submission timestamps retain that order, so the final Surah in the
  latest submit is shown instead of the first Surah or curriculum order.

### Added — Production Cleanup

- Added `npm run db:cleanup-production`, backed by a foreign-key-safe Prisma
  transaction. It deletes students, operational records, targets, scores,
  Tasmi records, audit logs, and ClassGroup/Halaqah rows while preserving users,
  teachers, AcademicYear meeting settings, AcademicClass, Surah, TargetSurah,
  and required auth/session data.

### Fixed

- Preserved sidebar scroll position across navigation for both Admin and Teacher.
- Prevented unnecessary sidebar auto-scrolling when the active navigation item
  was already visible.
- **Prevented accidental score decrement.** All score fields now reuse
  `NumericScoreInput` with `type="text"` and `inputMode="numeric"`, accepting
  only empty input or digits from 0–100. Native number spinners, mouse/touchpad
  wheel stepping, and ArrowUp/ArrowDown stepping can no longer change scores.
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
- **Release verification no longer requires a local `.env` for unit tests.**
  Academic-year calendar and timeline rules were separated from the
  Prisma-backed module, allowing `npm run verify` to run in release/CI
  environments with configuration supplied through normal CI environment
  variables.
- **Persistence architecture documentation** added to `docs/`.

### Tech stack (unchanged from v1.0.0)

Next.js 15.5 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 ·
Prisma 7.8 (`@prisma/adapter-pg`) · PostgreSQL (Neon) · NextAuth 5 ·
Upstash Redis · next-intl · exceljs · pdfkit · lucide-react · sonner · next-themes.

---

## [1.0.0] — 2026-07-01

See [`release/v1.0.0/CHANGELOG.md`](release/v1.0.0/CHANGELOG.md) for the full
v1.0.0 release notes.

[Unreleased]: https://github.com/azkafarhanm/tahfidz-tracker/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/azkafarhanm/tahfidz-tracker/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/azkafarhanm/tahfidz-tracker/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/azkafarhanm/tahfidz-tracker/releases/tag/v1.0.0
