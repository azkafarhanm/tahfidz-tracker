# PWA Bugs

Date: 2026-06-02

Severity key: BLOCKER / HIGH / MEDIUM / LOW

## BLOCKER

### PWA-001: No Offline Mutation Strategy

Affected areas:

- Quick log
- Hafalan/murojaah create/edit/delete
- Student create/edit/deactivate/reactivate/delete
- Target create/edit/complete/cancel
- Summative create/edit/delete
- Admin CRUD
- Profile email/password forms

Evidence:

- `web/public/sw.js` ignores non-GET requests.
- Server-action forms submit directly.
- Client action wrappers await server actions directly.
- No IndexedDB, outbox, retry queue, or background sync code exists.

Impact:

Installed PWA users can start data-entry workflows offline, but writes cannot complete or queue. This blocks an offline-capable PWA release.

Recommended fix:

Choose an explicit policy:

- Online-only mutations: disable submit buttons while offline and show clear copy.
- Offline-capable mutations: add IndexedDB outbox, background sync/retry, sync status UI, and conflict handling.

### PWA-002: No Background Sync / Outbox

Evidence:

- No `SyncManager`, `sync` event listener, IndexedDB queue, or mutation replay system found.

Impact:

Core teacher workflows cannot be safely captured offline and replayed later.

Recommended fix:

Start with an outbox for quick log, hafalan, and murojaah records before expanding to admin CRUD.

## HIGH

### PWA-003: Server Action Failures Are Not Consistently Caught

Evidence:

- `StudentCardActions` directly awaits deactivate/reactivate actions.
- `InlineConfirmActionButton` directly awaits `onAction()`.
- `ConfirmActionDialogButton` directly awaits `onAction()`.
- `TargetActions` directly awaits `completeTarget()`.

Impact:

Offline/flaky-network failures can bypass app-level toast/error handling and may leave menus, confirmations, or forms in confusing states.

Recommended fix:

Add a shared mutation runner that:

- Checks `navigator.onLine` before action.
- Catches rejected server actions.
- Shows a consistent offline/network error toast.
- Keeps form state intact.

### PWA-004: Dropdown Can Render Under Bottom Navigation

Evidence:

- Student kebab dropdown uses `z-20`.
- Bottom nav uses `z-30`.
- Dropdown opens downward from the card.

Impact:

On installed mobile PWA screens, a menu opened near the bottom can be partially hidden or untappable under the sticky bottom nav.

Recommended fix:

Use a portal/floating layer with a higher z-index, or detect viewport position and open upward when near the bottom.

### PWA-005: Service Worker Does Not Cache an Authenticated App Shell

Evidence:

- Navigation requests are network-first.
- `_next` requests are ignored.
- Only `/offline`, manifest, icons, and static assets are explicitly cached.

Impact:

Users cannot reliably reopen recently used authenticated routes offline. They get a generic offline page instead of a useful read-only shell.

Recommended fix:

Decide whether read-only offline views are in scope. If yes, add a controlled app-shell/data caching strategy for selected routes.

## MEDIUM

### PWA-006: Client-Side RSC Refreshes Can Fail Raw Offline

Evidence:

- Student pages call `router.refresh()` on focus/pageshow and after actions.
- Service worker fallback only covers navigation mode, not all RSC/data refresh requests.

Impact:

App resume in installed mode can trigger network requests while offline and may show stale UI, console errors, or framework-level fetch failures.

Recommended fix:

Skip auto-refresh while offline and refresh on `online` event.

### PWA-007: Install Prompt Is Chromium-Only

Evidence:

- `InstallPrompt` only listens for `beforeinstallprompt`.

Impact:

iOS users will not see install guidance because iOS Safari does not support that event.

Recommended fix:

Add an iOS-specific install hint using display-mode/user-agent detection.

### PWA-008: Install Prompt Can Overlap Mobile Controls

Evidence:

- Install prompt is `fixed bottom-20 z-50`.
- Bottom nav, sticky submit bars, and dialogs also occupy bottom/fixed layers.

Impact:

On short mobile screens, install prompt can cover sticky submit buttons or compete with modal/toast layers.

Recommended fix:

Coordinate overlay positions and pause install prompt on forms/modals.

### PWA-009: Offline Banner Can Cover Top Content

Evidence:

- Offline banner is fixed at top with `zIndex: 9999`.
- Layout does not reserve top padding when banner appears.

Impact:

In standalone PWA mode, the banner can cover header/back links.

Recommended fix:

Use a layout-aware banner region or add top padding while offline.

### PWA-010: Sticky Submit Bars May Compete With Bottom Nav

Evidence:

- Several forms use sticky bottom action bars.
- App shell also renders sticky bottom navigation on mobile.

Impact:

Long forms in mobile PWA mode can have stacked bottom controls, especially with browser safe areas.

Recommended fix:

Standardize mobile form action bars to account for bottom nav height or hide bottom nav on form pages.

### PWA-011: 320 px Viewport Needs Manual QA

Evidence:

- Multiple pages use compact action rows, badges, sticky bars, and translated text.
- Source review suggests wrapping is generally present, but not consistently across every module.

Impact:

Small Android devices may see crowded action rows or clipped text.

Recommended fix:

Run screenshot QA at 320, 375, 390, 430, and 768 px before release.

## LOW

### PWA-012: Install Dismissal Is Permanent

Evidence:

- `InstallPrompt` stores `pwa-dismissed` in localStorage and does not expose a later install entry point.

Impact:

Users who dismiss once may never discover installation again.

Recommended fix:

Add an install option in Profile or Settings.

### PWA-013: Manifest Lacks Optional PWA Enhancements

Evidence:

- Manifest has core fields and icons.
- No screenshots, shortcuts, categories, or protocol/file handlers.

Impact:

Installability is likely fine, but store-like install surfaces may be less polished.

Recommended fix:

Add screenshots and shortcuts after core blockers are fixed.

### PWA-014: Production SW Registration Only

Evidence:

- `ServiceWorkerRegistrar` registers only when `NODE_ENV === "production"`.

Impact:

Correct for normal development, but PWA QA must use production build/start or deployed HTTPS. Dev-server testing will not validate SW behavior.

Recommended fix:

Document this in QA steps.

