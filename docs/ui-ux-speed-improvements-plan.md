# UI/UX Speed Engineering Improvements Plan

Status: implementation completed in the current dirty worktree; retain this as the execution and rollback reference.

## Current Loading And Resilience Notes

- Route loading states now share `web/src/components/RouteTransitionSkeleton.tsx`
  for dashboard, directory, detail, form, table, app chrome, admin chrome, and
  bare profile-form skeletons.
- `web/src/app/globals.css` defines `route-transition-skeleton` with a short
  delayed reveal. This keeps fast App Router transitions from flashing a
  skeleton while preserving visible feedback for slower Server Component loads.
- Admin dashboard and directory data reads use sequential Prisma tasks on the
  affected paths to reduce connection-pool pressure during route transitions.
- `web/src/lib/prisma.ts` treats Neon "Connection terminated due to connection
  timeout" as transient, so existing retry handling covers that failure mode.
- No permanent route-loading probes are required; use browser network panels or
  local-only measurements when validating this area.

## Repository Facts

- App framework: Next.js App Router under `web/src/app`.
- UI model: mostly React Server Components with focused client components under `web/src/components`.
- Data layer: Prisma 7 with PostgreSQL models in `web/prisma/schema.prisma`.
- Cache layer: in-memory TTL cache in `web/src/lib/cache.ts`; current hot cached modules include dashboard, formative, summative, and reports.
- Auth: NextAuth credentials/JWT configuration in `web/src/auth.ts`, `web/src/auth.config.ts`; request validation helper in `web/src/lib/session.ts`.
- Existing verification commands: `npm --prefix web run lint`, `typecheck`, `test`, `build`, plus root `npm run verify`.
- Existing tests: Vitest unit tests for cache, academic year, form helpers, rate limit, and selected student detail behavior.

## Assumptions And Unknowns

- PostgreSQL is the production database because Prisma datasource is `postgresql`; exact hosting, version, extension permissions, and query plan visibility are unknown.
- No APM, OpenTelemetry, or query logging pipeline is present in the repository.
- No Playwright, Lighthouse, or bundle analyzer configuration is present.
- The app appears to be single-process or horizontally replicated without distributed cache coordination; existing memory cache is per Node process.
- Service worker is handwritten in `web/public/sw.js`; no Workbox or offline sync framework exists.

## Architecture And Boundaries

- Server routes/pages should continue to load data via `web/src/lib/*` modules, not direct Prisma queries from client components.
- Client components should stay limited to interaction state, navigation helpers, and browser-only effects.
- Database changes should be additive Prisma migrations; no destructive schema changes are needed for this plan.
- Cache keys must align with existing invalidation prefixes in `invalidateStudentRelatedCaches`.
- Auth/session validation must not trust stale JWT fields for account-active checks beyond a short TTL.
- Security-sensitive cache changes must be isolated from low-risk payload/query optimizations so they can be skipped or reverted independently.

## Implementation Phases

### Phase 0: Baseline And Guardrails

**Objective**

Establish a small baseline so performance changes are measurable and regressions are easy to detect.

**Scope**

- No product behavior changes.
- Add or document local measurement steps only if they fit existing tooling.

**Technical Tasks**

- Record current output for:
  - `npm --prefix web run lint`
  - `npm --prefix web run typecheck`
  - `npm --prefix web run test`
  - `npm --prefix web run build`
- Capture rough before/after timings for key routes using local dev or production build:
  - `/`
  - `/students`
  - `/quick-log`
  - `/formative`
  - `/summative`
- For UI navigation changes, record browser network request count per interaction, not only wall-clock timing.
- For cache changes, enable `APP_CACHE_DEBUG=true` only in local development when confirming hit/miss behavior.
- For database-sensitive work, capture query counts manually by enabling Prisma/Postgres logs only in local development, if available.

**Dependencies**

- Local environment variables and database must be available for full build/runtime checks.

**Risks/Blockers**

- Local DB may not match production data volume.
- Build may fail due to unrelated local environment issues.

**Deliverables**

- Baseline notes with:
  - command pass/fail state
  - route timing/request-count notes
  - any local environment limitations

**Validation/Testing Criteria**

- Baseline commands either pass or failures are documented before app changes begin.

**Exit Criteria**

- Baseline exists for route latency/request count enough to compare changes.

### Phase 1: Remove Redundant Navigation Requests

**Objective**

Reduce unnecessary RSC/server requests from interactive search and filter controls.

**Scope**

- `web/src/components/LiveSearchForm.tsx`
- Optional review of `web/src/components/SegmentedLinkTabs.tsx`
- No API, database, or schema changes.

**Technical Tasks**

- Remove `router.prefetch(nextHref)` immediately before `router.replace(nextHref)` in `LiveSearchForm`.
- Keep debounce behavior and `router.replace(..., { scroll: false })`.
- Confirm one-character query guard still prevents noisy searches.
- Review `SegmentedLinkTabs` prefetch-on-mount behavior; keep only if network traces show benefit, otherwise move prefetch to hover/focus.

**Dependencies**

- Existing Next.js router behavior.
- Existing list pages using `LiveSearchForm`: teacher students and admin teacher/student/class/halaqah pages.

**Risks/Blockers**

- Removing prefetch may slightly reduce perceived speed for searches that are typed and then submitted much later, but current code navigates in the same debounce tick, making prefetch mostly duplicate work.

**Deliverables**

- Updated search/navigation client component behavior.

**Validation/Testing Criteria**

- Type in `/students` search and confirm URL/query updates after debounce.
- Submit search form and confirm results update.
- Confirm no duplicate network requests for a single debounced query in browser devtools.
- Run lint/typecheck.

**Exit Criteria**

- Search behavior remains unchanged from user perspective.
- Request count per debounced search is reduced.

### Phase 2: Cache Safe Read Paths And Reduce Payloads

**Objective**

Use existing in-memory cache and invalidation patterns to accelerate repeated navigations and reduce serialized data while keeping security-sensitive session checks independently reversible.

**Scope**

- `web/src/lib/session.ts`
- `web/src/lib/students.ts`
- `web/src/lib/quick-log.ts`
- `web/src/lib/cache.ts`
- Existing mutation modules that already invalidate student-related cache prefixes.
- No distributed cache or new infrastructure.

**Technical Tasks**

- Implement the payload-only change first: replace hydrated active target IDs in `getStudentsDataInner` with Prisma `_count`.
  - Current pattern: include `targets: { where, select: { id: true } }`.
  - Target pattern: `_count: { select: { targets: { where: { status: ACTIVE } } } }`.
- Add cache wrappers for student read paths:
  - `getStudentsPageData`
  - `getInactiveStudentsData`
  - `getStudentDetailData`
  - `getQuickLogStudents`
- Use cache keys that start with existing invalidation prefixes where possible:
  - `students:list:*`
  - `students:inactive:*`
  - `students:detail:*`
- Extend `invalidateStudentRelatedCaches` for quick-log data if using a new prefix such as `quick-log-students:*`.
- Build an invalidation matrix before adding each cache entry. At minimum, verify coverage for:
  - `web/src/lib/record-actions.ts`
  - `web/src/lib/target-actions.ts`
  - `web/src/app/quick-log/actions.ts`
  - `web/src/app/students/actions.ts`
  - `web/src/app/students/[id]/edit/actions.ts`
  - `web/src/app/admin/students/actions.ts`
  - `web/src/app/summative/actions.ts`
- Treat session-scope caching as a separate subtask after student caches are validated.
  - Cache only the database validation result, not `auth()` itself.
  - Suggested key: `session-scope:${session.user.id}`.
  - Suggested TTL: 3-5 seconds, not 30 seconds.
  - Do not implement session caching if user/teacher deactivation must be reflected immediately across all server instances.
  - Invalidate the exact user key when admin teacher/user actions change `User.isActive`, `Teacher.isActive`, `User.name`, `User.email`, or role-related fields.
  - Profile password changes do not need invalidation unless cached data later includes password-derived fields.

**Dependencies**

- Existing `cached`, `invalidateCache`, and `invalidateStudentRelatedCaches`.
- Existing server actions already call invalidation after record, target, student, quick-log, and summative mutations.

**Risks/Blockers**

- Memory cache is per process. In multi-instance deployments, stale data can survive up to TTL on other instances.
- Session active-state cache can briefly permit access after deactivation unless TTL is very short and same-process invalidation occurs.
- Student cache keys must include `teacherId`, locale, query, page, page size, and student ID where relevant.
- List/detail caches can leak cross-tenant data if teacher/admin scope is missing from keys.
- Cache invalidation bugs are more likely than query bugs; keep cache additions small and test one prefix at a time.

**Deliverables**

- Reduced Prisma payload for active target counts.
- Cached student list/detail/quick-log loaders.
- Cache invalidation matrix in PR notes.
- Optional cached session validation helper, shipped separately from student caches if implemented.

**Validation/Testing Criteria**

- Existing Vitest suite passes.
- Add focused unit tests for key building or invalidation helpers if helper logic becomes nontrivial.
- Manually verify:
  - `/students` loads, searches, paginates.
  - `/quick-log` student picker still contains correct active students.
  - `/students/[id]` updates after creating/deleting records.
  - Inactive/reactivated students are reflected after relevant actions.
  - If session caching is implemented, deactivating a teacher/admin account denies access after invalidation or after the documented TTL.

**Exit Criteria**

- Repeated navigation to cached routes avoids repeated equivalent DB queries within TTL.
- Mutations still refresh user-visible data within expected TTL/invalidation behavior.
- Session cache is either omitted, or its stale-access window is explicitly accepted and documented.

### Phase 3: Add Search-Path Database Indexes

**Objective**

Keep search pages fast as data volume grows by indexing actual case-insensitive search patterns.

**Scope**

- `web/prisma/schema.prisma`
- New Prisma migration under `web/prisma/migrations/*`
- Search columns used in:
  - `web/src/lib/students.ts`
  - `web/src/lib/admin.ts`

**Technical Tasks**

- Capture representative SQL/query plans for the actual Prisma search queries before choosing index type.
- Do not add all candidate indexes blindly. Start with the highest-traffic route and columns proven by query plan or observed latency.
- Evaluate index options:
  - `pg_trgm` GIN indexes for current Prisma `startsWith` + `mode: "insensitive"` queries if the generated SQL uses `ILIKE` and plans benefit from trigram.
  - Functional btree indexes on `lower(column) text_pattern_ops` only if queries are adjusted to use matching `lower(column) LIKE 'prefix%'` SQL.
  - Existing plain btree indexes are sufficient only if query plans confirm they are used for the case-insensitive predicate.
- Candidate columns, in likely priority order:
  - `Student.fullName`
  - `Teacher.fullName`
  - `User.email`
  - `ClassGroup.name`
  - `AcademicClass.name`
  - `ClassGroup.academicYear` and `ClassGroup.description` only if admin halaqah search proves slow.
- If using `pg_trgm`, create additive migration with `CREATE EXTENSION IF NOT EXISTS pg_trgm;` and explicit index names.
- Keep current search semantics unless query plan review requires a controlled change.

**Dependencies**

- Database extension permissions.
- Prisma migration workflow.

**Risks/Blockers**

- `pg_trgm` may not be enabled by the database provider or current DB role.
- Extra indexes increase write cost and storage; avoid speculative indexes on low-traffic fields.
- Prisma schema may not fully express extension/index type; raw SQL migration may be required.
- Functional indexes will not help unless generated SQL matches the index expression.

**Deliverables**

- Query-plan note identifying chosen columns and index type.
- Additive migration for proven search indexes.
- Migration notes explaining any raw SQL index or extension usage.

**Validation/Testing Criteria**

- `npm --prefix web run db:validate`
- Migration applies on local DB.
- Search pages return same results before/after.
- If possible, compare `EXPLAIN ANALYZE` on representative search queries.

**Exit Criteria**

- Indexed search plans are available for proven hot search columns, or extension limitations are documented with fallback.

### Phase 4: Aggregate Dashboard Metrics In The Database

**Objective**

Reduce dashboard payload and CPU by calculating ayah totals in SQL instead of loading all weekly/active rows.

**Scope**

- `web/src/lib/dashboard.ts`
- No UI component changes unless response shape is intentionally refined.
- No schema changes expected.

**Technical Tasks**

- Keep recent-record queries unchanged because UI needs record details.
- Replace these row-fetch-plus-reduce paths with aggregate helpers:
  - weekly memorization ayah total
  - weekly revision ayah total
  - active target ayah total
- Prefer Prisma-supported aggregate/grouping if it can express the calculation; otherwise use parameterized Prisma `$queryRaw`.
- Preserve teacher filtering for teacher scope and admin scope.
- Keep cache key behavior unchanged.
- Normalize aggregate results so missing rows return `0`.

**Dependencies**

- PostgreSQL expression support.
- Existing dashboard cache.

**Risks/Blockers**

- Raw SQL needs careful parameterization and separate admin/teacher filters.
- Off-by-one ayah count must match existing `toAyah - fromAyah + 1` behavior.
- Date range semantics must remain identical.

**Deliverables**

- Dashboard loader returns same shape with fewer fetched rows.
- Optional focused tests for aggregate helper if extracted into pure functions or mockable module.

**Validation/Testing Criteria**

- Compare dashboard values before/after on seeded/local data.
- Include cases with no records, one record, and reversed-invalid data if such data can exist from older imports.
- Verify teacher and admin dashboards.
- Run lint/typecheck/tests/build.

**Exit Criteria**

- Dashboard displays identical metrics.
- DB result payload for weekly/target progress is scalar instead of O(records).

### Phase 5: Gate Client-Only Animation And Hidden UI Work

**Objective**

Reduce hydration, timers, and background CPU on mobile and low-motion users.

**Scope**

- `web/src/components/AppShell.tsx`
- `web/src/components/FloatingIslamicClock.tsx`
- `web/src/components/SidebarIslamicClock.tsx`
- `web/src/components/MotivationCard.tsx`
- `web/src/components/FloatingSurahs.tsx`
- Usage sites: dashboard, sidebar, login.

**Technical Tasks**

- Do not mount `FloatingIslamicClock` until client media query confirms `min-width: 1280px`.
- Ensure clock interval is not active when the clock is hidden or tab is hidden.
- Add `prefers-reduced-motion` handling for `MotivationCard` and `FloatingSurahs`.
- Avoid rendering duplicate `MotivationCard` instances where sidebar and dashboard overlap on desktop only if product/design accepts the visual change; otherwise keep both and only pause hidden/offscreen timers.
- Keep visual fallback stable to prevent layout shift.

**Dependencies**

- Existing dynamic imports.
- Browser APIs: `matchMedia`, `visibilitychange`, `requestAnimationFrame`.

**Risks/Blockers**

- Hydration mismatch risk if media query state affects server-rendered markup; solve by rendering `null` until mounted.
- Visual differences for users who currently see animations on first paint.
- Login canvas contains mojibake-looking Arabic strings in `FloatingSurahs`; this plan does not correct content unless separately requested.
- CSS-hidden elements can still run effects; validation must confirm component mount/effect behavior, not just visibility.

**Deliverables**

- Client effects mount only when visible/relevant.
- Reduced-motion users receive static or minimal animation behavior.

**Validation/Testing Criteria**

- Manual browser checks at mobile and desktop widths.
- Confirm no React hydration warnings.
- Confirm clock still appears on `xl` desktop and drag persistence still works.
- Confirm login background does not run RAF when reduced motion is set.
- Confirm visible motivation card behavior still matches accepted product behavior.

**Exit Criteria**

- Hidden UI no longer starts timers/chunks on mobile.
- Visible behavior remains acceptable on desktop.

### Phase 6: Final Verification, Rollback, And Release Notes

**Objective**

Ship incrementally with clear rollback paths and measurable acceptance criteria.

**Scope**

- Applies to all phases above.
- No new deployment platform assumptions.

**Technical Tasks**

- Run full verification:
  - `npm --prefix web run lint`
  - `npm --prefix web run typecheck`
  - `npm --prefix web run test`
  - `npm --prefix web run build`
  - `npm --prefix web run db:validate`
- For DB phase, verify migration on a disposable/local database before production.
- Document before/after request counts and route timing where measurable.
- Keep each phase in a separate commit or PR if operationally possible.

**Dependencies**

- Working local environment.
- Database migration access for Phase 3.

**Risks/Blockers**

- Build may need production-like env vars.
- Query performance cannot be fully proven without production-like data.

**Deliverables**

- Verification summary.
- Rollback notes per phase.
- Known residual risks.

**Validation/Testing Criteria**

- Automated verification passes or failures are documented with root cause.
- Manual smoke tests cover dashboard, students, quick log, formative, summative, login, and admin list search.

**Exit Criteria**

- Changes are independently revertible.
- No known user-facing regressions remain.

## Data Flow Notes

- Navigation/search flow: client component updates URL via Next router; server page reloads RSC data through `web/src/lib/*` loader.
- Student mutation flow: server action writes via Prisma, calls `revalidatePath`, then `invalidateStudentRelatedCaches`.
- Dashboard flow: server page calls `requireSessionScope`, then `getDashboardData`, which currently uses in-memory cache and Prisma queries.
- Auth flow: middleware checks JWT presence; page/action helpers call `requireSessionScope`, which currently revalidates user status from DB.

## API And Contract Considerations

- No public API contract changes are planned.
- Export/PDF report routes are not changed by these phases except indirectly through cache invalidation if shared data helpers are reused.
- Loader return shapes should remain stable unless a phase explicitly updates dependent components in the same change.

## Database And Schema Considerations

- Phase 3 is additive only.
- No model fields, relations, or constraints need removal.
- Raw SQL migrations are acceptable where Prisma schema cannot express PostgreSQL extension/index type.
- Index names should be explicit and stable to simplify rollback.

## State Management Considerations

- Client state remains local React state.
- URL remains the source of truth for list filters/search.
- Cookies remain the source for timezone and grading view preferences.
- New cache state is server memory only and must stay TTL-bounded.

## Performance Considerations

- Prioritize removing duplicate requests before deeper query changes.
- Prefer scalar/count/aggregate queries over hydrating relation rows when UI only needs counts.
- Keep cache TTLs short for high-churn user-visible data.
- Avoid mounting browser-only effects that are hidden by CSS.

## Security Considerations

- Do not cache failed/unauthenticated session scopes longer than necessary.
- Do not weaken active-user and active-teacher checks.
- Continue parameterizing raw SQL through Prisma APIs.
- Do not cache data across teacher/admin scopes without teacherId/role in cache keys.
- Prefer omitting session-scope caching over accepting an unbounded or undocumented stale-access window.

## Observability And Logging

- Existing cache supports debug logging through `APP_CACHE_DEBUG`.
- No persistent observability stack exists in repo.
- Use local debug logs and browser network panels for validation.
- Avoid adding permanent noisy logs in hot paths.

## Rollback Strategy

- Phase 1 rollback: restore removed prefetch calls.
- Phase 2 rollback: remove cache wrappers or lower TTL to near-zero; session cache can be reverted independently; keep `_count` change if verified because it is equivalent behavior.
- Phase 3 rollback: drop added indexes/extension-dependent objects through a reverse migration if the database provider requires it.
- Phase 4 rollback: restore previous `findMany` plus JS reduce implementation in `dashboard.ts`.
- Phase 5 rollback: restore previous dynamic imports/mount behavior.

## Edge Cases And Failure Handling

- Cache keys must distinguish admin scope from teacher scope.
- Cache invalidation must handle student creation, update, deactivate/reactivate, record CRUD, target CRUD, quick log, formative, and summative mutations.
- Timezone cookie absence must keep current UTC fallback behavior.
- Reduced-motion behavior must not hide required content.
- Search must behave consistently for empty query, one-character query, pagination, and admin/teacher role scopes.
- Raw SQL dashboard aggregates must return `0`, not `null`, when no rows match.

## Recommended Execution Order

1. Phase 0: baseline.
2. Phase 1: remove redundant search prefetch.
3. Phase 2a: `_count` payload reduction.
4. Phase 2b: student/quick-log cache wrappers with invalidation matrix.
5. Phase 5: hidden UI/animation gating.
6. Phase 4: dashboard SQL aggregation.
7. Phase 3: database indexes after query-plan review.
8. Phase 2c: optional session-scope cache only if stale-access window is accepted.
9. Phase 6: final verification and release notes.

This order ships the lowest-risk application changes first, leaves database migration work until after code-only wins, and defers the security-sensitive session cache until the safer performance work has been validated.
