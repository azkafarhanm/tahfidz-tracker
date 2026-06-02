# PWA Release Checklist

Date: 2026-06-02

## Release Decision

- [ ] Decide release mode:
  - [ ] Online-first installable PWA
  - [ ] Offline-capable PWA
- [ ] If online-first, add release note: data entry and admin changes require internet.
- [ ] If offline-capable, complete all BLOCKER items before release.

## BLOCKER

- [ ] Define offline mutation policy for all forms and server actions.
- [ ] Add offline guards to all mutation entry points or build an offline queue.
- [ ] Add background sync/outbox for core teacher data entry.
- [ ] Preserve unsaved form data when network fails.
- [ ] Provide consistent offline/network error toast for server-action failures.

## HIGH

- [ ] Add shared client mutation wrapper with `try/catch`.
- [ ] Skip `router.refresh()` while offline; retry on `online`.
- [ ] Fix student/action dropdown layering above bottom nav.
- [ ] Decide app-shell/read-only cache strategy.
- [ ] Validate service worker behavior with production build over HTTPS.

## MEDIUM

- [ ] Add iOS add-to-home-screen guidance.
- [ ] Prevent install prompt from appearing over forms/modals.
- [ ] Make offline banner layout-aware.
- [ ] Review all sticky bottom form bars against mobile bottom nav.
- [ ] Run responsive screenshots at:
  - [ ] 320 px
  - [ ] 375 px
  - [ ] 390 px
  - [ ] 430 px
  - [ ] 768 px
- [ ] Test at each width:
  - [ ] `/students`
  - [ ] `/students?status=inactive`
  - [ ] `/quick-log`
  - [ ] `/students/new`
  - [ ] `/students/[id]/hafalan/new`
  - [ ] `/students/[id]/murojaah/new`
  - [ ] `/students/[id]/targets/new`
  - [ ] `/summative`
  - [ ] `/admin/students`
  - [ ] `/profile`

## LOW

- [ ] Add Profile/Settings install entry point after prompt dismissal.
- [ ] Add manifest screenshots.
- [ ] Add manifest shortcuts for Dashboard, Students, Quick Log, Reports.
- [ ] Visually validate maskable icon safe area.

## Installability Checks

- [ ] Run `npm --prefix web run build`.
- [ ] Run `npm --prefix web run start`.
- [ ] Serve over HTTPS or production-equivalent environment.
- [ ] Open Chrome DevTools Application tab.
- [ ] Confirm manifest loads with no errors.
- [ ] Confirm service worker is registered.
- [ ] Confirm offline page is cached.
- [ ] Run Lighthouse PWA audit.
- [ ] Install on Android Chrome.
- [ ] Add to Home Screen on iOS Safari.
- [ ] Confirm standalone display mode.
- [ ] Confirm status bar/theme color.
- [ ] Confirm app returns to the last useful route after app switch/resume.

## Offline Tests

- [ ] Load dashboard online, then go offline and reload.
- [ ] Load `/students` online, then go offline and reload.
- [ ] Load `/quick-log` online, then go offline and reload.
- [ ] Try submitting quick log offline.
- [ ] Try adding hafalan offline.
- [ ] Try adding murojaah offline.
- [ ] Try completing/canceling a target offline.
- [ ] Try deactivating/reactivating a student offline.
- [ ] Try editing profile email/password offline.
- [ ] Try admin create/edit/toggle/delete offline.
- [ ] Confirm every offline mutation shows a clear message and preserves user input.
- [ ] Return online and confirm queued actions sync, or confirm blocked actions can be retried manually.

## Overlay And Navigation Tests

- [ ] Open student kebab menu near bottom of viewport.
- [ ] Confirm menu is not hidden behind bottom nav.
- [ ] Open inline deactivate confirmation near bottom of viewport.
- [ ] Trigger toast while bottom nav is visible.
- [ ] Show install prompt while bottom nav is visible.
- [ ] Show offline banner while viewing `/students`.
- [ ] Open confirm dialog on 320 px width.
- [ ] Confirm no modal content is clipped vertically.
- [ ] Confirm sticky submit bar does not cover the final form field.

## Responsive QA Matrix

| Viewport | Portrait | Standalone PWA | Browser Tab | Notes |
|---:|---|---|---|---|
| 320 px | [ ] | [ ] | [ ] | Smallest supported width. |
| 375 px | [ ] | [ ] | [ ] | iPhone SE-class width. |
| 390 px | [ ] | [ ] | [ ] | Common modern iPhone width. |
| 430 px | [ ] | [ ] | [ ] | Large phone width. |
| 768 px | [ ] | [ ] | [ ] | Tablet/small desktop breakpoint. |

## Final Release Gate

- [ ] No BLOCKER PWA bugs remain.
- [ ] HIGH bugs have fixes or explicit release-owner signoff.
- [ ] Lighthouse PWA audit passes.
- [ ] Manual responsive QA completed.
- [ ] Android install test completed.
- [ ] iOS add-to-home-screen test completed.
- [ ] Offline behavior matches release promise.
- [ ] Release notes clearly describe offline limitations, if any.

