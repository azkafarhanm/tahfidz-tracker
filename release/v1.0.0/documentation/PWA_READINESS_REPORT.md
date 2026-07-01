# TahfidzFlow PWA Readiness Report

Date: 2026-06-02

## Summary

TahfidzFlow has a solid PWA foundation: a manifest exists, install prompt UI exists, a service worker is registered in production, a cached offline page exists, and the app is already structured as a mobile-first experience.

It is not fully PWA-ready for production as an installed mobile app yet. The main gap is offline behavior for mutations and forms. Core workflows such as quick log, hafalan/murojaah records, targets, student management, admin CRUD, profile changes, and summative scores all depend on live server actions with no offline queue, retry, draft preservation, or consistent offline error handling.

## Readiness Matrix

| Area | Status | Severity | Notes |
|---|---:|---|---|
| Offline behavior for mutations/forms | Not ready | BLOCKER | No background sync, offline queue, form draft persistence, or consistent offline guards for server actions. |
| Service worker caching strategy | Partial | HIGH | Navigation fallback exists, but authenticated/RSC data and mutations are online-only. No app-shell/data cache strategy. |
| Installability | Mostly ready | LOW | Manifest, icons, standalone display, and SW exist. Needs real Lighthouse/device validation. |
| Mobile navigation UX | Partial | MEDIUM | Bottom nav is safe-area aware, but sticky form controls and overlays can compete for vertical space. |
| Toast/dropdown/modal overlap | Needs hardening | HIGH | Bottom nav, install prompt, toasts, inline confirms, and dropdown menus all use overlapping fixed/sticky layers. |
| Responsive layouts 320-768 px | Partial | MEDIUM | Most layouts are mobile-first, but several action rows and sticky bars need viewport QA at 320 px. |
| PWA install flow | Partial | MEDIUM | `beforeinstallprompt` flow exists for Chromium; no iOS-specific install guidance. |
| Background sync support | Missing | BLOCKER | No SyncManager, IndexedDB outbox, retry queue, or conflict strategy. |
| Offline fallback screens | Partial | MEDIUM | `/offline` is cached and public, but only navigation failures route there. Client-side data refreshes can fail raw. |
| Production blockers | Present | BLOCKER | Offline mutation/data-entry behavior blocks a true PWA release. |

## Findings By Area

### 1. Offline Behavior

All mutations are online-only. Server actions and form posts include:

- Teacher student CRUD: `web/src/app/students/actions.ts`, `web/src/app/students/[id]/edit/actions.ts`
- Hafalan/murojaah create/update/delete: `web/src/app/students/[id]/hafalan/actions.ts`, `web/src/app/students/[id]/murojaah/actions.ts`, `web/src/lib/record-actions.ts`
- Quick log: `web/src/app/quick-log/actions.ts`
- Targets: `web/src/lib/target-actions.ts`
- Summative scores: `web/src/app/summative/actions.ts`
- Admin CRUD: `web/src/app/admin/**/actions.ts`
- Profile changes: `web/src/app/profile/change-email/actions.ts`, `web/src/app/profile/change-password/actions.ts`
- Locale/logout/login flows: `web/src/i18n/actions.ts`, auth flows

Client handlers generally call server actions directly. Examples:

- `StudentCardActions` awaits deactivate/reactivate server actions without a network `try/catch`.
- `InlineConfirmActionButton` awaits `onAction()` without a network `try/catch`.
- `ConfirmActionDialogButton` awaits `onAction()` without a network `try/catch`.
- `TargetActions` awaits `completeTarget()` without a network `try/catch`.
- Form components submit server actions directly, so offline submit behavior is browser/framework failure rather than app-managed feedback.

Impact: in installed PWA mode, users can type a record while offline, tap save, and lose confidence or potentially lose form state depending on navigation/error behavior.

### 2. Service Worker Caching Strategy

The service worker caches only:

- `/offline`
- `/manifest.json`
- app icons
- static assets by extension after first request

Navigation requests use network-first with offline-page fallback. `_next` requests are ignored, reports/auth APIs are ignored, and POST/non-GET requests are ignored.

This is safe for avoiding stale writes, but incomplete for PWA use:

- No cached authenticated app shell for `/students`, `/quick-log`, `/reports`, etc.
- No offline cache for recent read-only data.
- No strategy for Next RSC/client refresh failures.
- No mutation queue or replay.
- No cache version/date metadata surfaced to users.

### 3. Installability

Current installability positives:

- `web/public/manifest.json` exists.
- `display` is `standalone`.
- `start_url` and `scope` are `/`.
- `theme_color` and `background_color` are set.
- 192x192, 512x512, and maskable icon entries exist.
- `ServiceWorkerRegistrar` registers `/sw.js` in production.
- `InstallPrompt` handles `beforeinstallprompt`.

Remaining validation:

- Run Lighthouse PWA audit against production build over HTTPS.
- Validate maskable icon safe area visually.
- Validate install on Android Chrome.
- Validate add-to-home-screen on iOS Safari.

### 4. Mobile Navigation UX

The shell is mobile-first and uses a sticky bottom nav with safe-area padding:

- `AppShell` adds bottom padding with `env(safe-area-inset-bottom)`.
- `BottomNav` is sticky and horizontally scrollable.

Risks:

- Bottom nav `z-30` can sit above card dropdowns using lower z-index.
- Sticky form action bars use `bottom-4` or `bottom-0` and can overlap the bottom nav visually in longer forms.
- Install prompt uses `fixed bottom-20 z-50`, which can collide with toasts and modal overlays on shorter screens.

### 5. Toast / Dropdown / Modal Overlap

Layering is inconsistent:

- Bottom nav: `z-30`
- Student kebab dropdown: `z-20`
- Install prompt: `z-50`
- Dialog overlay: `z-50`
- Offline banner: inline style `zIndex: 9999`
- Sonner toast: library-managed top-center layer

Likely issues:

- Student dropdown opened near the bottom may render under bottom nav.
- Install prompt can overlap sticky bottom actions on mobile.
- Offline banner can cover top content without top padding.
- Multiple overlays do not share a central z-index policy.

### 6. Responsive Layout Review

Source review only; real screenshots still needed.

| Width | Risk Level | Notes |
|---:|---|---|
| 320 px | MEDIUM | Highest risk. Action rows, sticky bars, inactive row actions, and long Indonesian/Arabic strings may crowd. |
| 375 px | MEDIUM | Likely usable, but dropdown near bottom and sticky bars need QA. |
| 390 px | LOW-MEDIUM | Main student cards should fit; overlay layering still needs validation. |
| 430 px | LOW-MEDIUM | Mostly safe; check install prompt + bottom nav + dropdown. |
| 768 px | LOW | Two-column student grid and sidebar breakpoint behavior should be fine. |

Areas to screenshot:

- `/students` active list
- `/students?status=inactive`
- Student card kebab menu
- Kebab inline deactivate confirmation
- Quick log dropdown
- Record/target forms with sticky submit bars
- Admin cards with inline confirm actions

### 7. PWA Install Flow

Chromium flow exists through `beforeinstallprompt`. Limitations:

- No iOS install instructions because iOS Safari does not fire `beforeinstallprompt`.
- Dismissal is permanent via `localStorage` key `pwa-dismissed`; there is no later “Install app” entry point.
- The prompt does not account for `display-mode: standalone`; it may need explicit installed-mode suppression checks.

### 8. Background Sync Support

No background sync support was found:

- No `SyncManager`
- No `self.addEventListener("sync")`
- No IndexedDB outbox
- No retry queue
- No conflict-resolution model

For a tahfidz tracker, the most important offline queue candidates are:

- Quick log records
- Hafalan records
- Murojaah records
- Target completion/cancellation

### 9. Offline Fallback Screens

The `/offline` page exists and is cached. It is public in auth config.

Limitations:

- It only handles failed navigation requests through the service worker.
- Client-side refreshes and server action failures do not consistently route to `/offline`.
- It has a “Back to dashboard” link that may just hit the offline fallback again if the device is still offline.

### 10. Production Blockers

For a normal online web release, there are no obvious PWA-specific blockers.

For a PWA release marketed as installable/mobile/offline-capable, blockers remain:

- Missing offline mutation strategy.
- Missing background sync/outbox for core data entry.
- Inconsistent offline error handling for all server-action flows.

## Recommended Release Position

Do not market TahfidzFlow as offline-capable yet.

It can be released as an installable, online-first PWA only if release notes clearly state that creating/updating data requires an internet connection.

