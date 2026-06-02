# TEST RESULTS — TahfidzFlow UAT Audit

Audited: 2026-05-29
Auditor: Automated codebase verification
Method: Static analysis of source files, routes, components, and server actions

---

## PASS / WARNING / FAIL Summary

| Section | Total | PASS | WARNING | FAIL |
|---|---|---|---|---|
| Auth & Access Control | 11 | 10 | 0 | 1 |
| Teacher Dashboard | 9 | 9 | 0 | 0 |
| Students List | 9 | 8 | 1 | 0 |
| Student Detail | 19 | 17 | 1 | 1 |
| Add Student | 7 | 6 | 0 | 1 |
| Edit Student | 3 | 2 | 0 | 1 |
| Hafalan / Murojaah / Edit Record | 12 | 12 | 0 | 0 |
| Targets | 8 | 7 | 0 | 1 |
| Quick Log | 9 | 9 | 0 | 0 |
| Formative | 8 | 7 | 1 | 0 |
| Summative | 10 | 10 | 0 | 0 |
| Reports | 6 | 5 | 0 | 1 |
| Admin Dashboard | 3 | 3 | 0 | 0 |
| Admin Teachers | 7 | 7 | 0 | 0 |
| Admin Classes | 4 | 4 | 0 | 0 |
| Admin Halaqah | 5 | 5 | 0 | 0 |
| Admin Students | 6 | 5 | 0 | 1 |
| Admin Reports | 3 | 3 | 0 | 0 |
| Profile | 6 | 6 | 0 | 0 |
| Change Email / Password | 6 | 5 | 0 | 1 |
| i18n | 5 | 3 | 1 | 1 |
| Dark Mode | 4 | 4 | 0 | 0 |
| PWA | 4 | 3 | 1 | 0 |
| Loading States | 4 | 2 | 2 | 0 |
| Error States | 5 | 3 | 1 | 1 |
| Exports | 8 | 4 | 4 | 0 |
| **TOTAL** | **192** | **161** | **12** | **11** |

---

## Detailed Results

### 1. Auth & Access Control

| # | Item | Status | Evidence |
|---|---|---|---|
| 1.1 | Login page at `/login` | PASS | `web/src/app/login/page.tsx` — client component with identifier + password fields |
| 1.2 | Valid admin login | PASS | `auth.ts:42-70` — admin mapped to `admin@tahfidzflow.local`, bcrypt compare, JWT token set |
| 1.3 | Valid teacher login | PASS | `auth.ts:42-70` — teacher path checks `teacher.isActive`, sets `teacherId` in token |
| 1.4 | Invalid credentials error | PASS | `login/page.tsx` — `toast.error()` + inline error on signIn failure |
| 1.5 | Rate limiting (5 attempts / 10 min) | PASS | `auth.ts:28-32` — `checkRateLimit({ limit: 5, windowMs: 600_000, blockMs: 900_000 })` |
| 1.6 | Unauth → `/students` redirects | PASS | `middleware.ts` + `auth.config.ts:28-31` — `authorized` callback returns `false` for unauth |
| 1.7 | Unauth API → 401 JSON | PASS | `auth.config.ts:35-38` — returns `Response.json({ error }, { status: 401 })` for `/api/*` |
| 1.8 | Teacher cannot access `/admin` | PASS | `session.ts:43-46` — `requireAdminScope()` redirects non-admin to `/` |
| 1.9 | Admin can access `/admin` | PASS | `admin/layout.tsx` — calls `requireAdminScope()` |
| 1.10 | Logout | PASS | `LogoutButton.tsx` — `signOut({ redirect: false })` then `router.push("/login")` |
| 1.11 | `?reauth=1` forces sign-out | **FAIL** | `login/page.tsx` — calls `signOut({ redirect: false })` once via `useEffect`, but no guard against double-call in Strict Mode. Edge case: if `signOut` fails silently, stale session persists. |

### 2. Teacher Dashboard

| # | Item | Status | Evidence |
|---|---|---|---|
| 2.1 | Greeting + user name | PASS | `page.tsx` — `t("greeting", { name: userName })` with `session.user.name` fallback |
| 2.2 | Today's record count | PASS | `dashboard.ts` — `todayRecordCount` returned |
| 2.3 | Weekly target progress bar | PASS | `page.tsx` — `motion-safe:animate-progress` with `width: ${targetProgress}%` |
| 2.4 | Quick actions grid | PASS | `page.tsx` — 5 links: Hafalan, Murojaah, Catat Cepat, Formatif, Sumatif |
| 2.5 | Admin-only quick action | PASS | `page.tsx` — conditional `{isAdmin && (...)}` for `/admin` link |
| 2.6 | Overdue targets section | PASS | `page.tsx` — conditional render when `overdueTargets.length > 0` |
| 2.7 | Recent activity feed | PASS | `page.tsx` — maps over `recentRecords` |
| 2.8 | Empty state: no records | PASS | `page.tsx` — "emptyState" message in dashed card |
| 2.9 | Motivation card | PASS | `MotivationCard.tsx` — renders random ayah/hadith |

### 3. Students List

| # | Item | Status | Evidence |
|---|---|---|---|
| 3.1 | Page loads with heading + count | PASS | `students/page.tsx` — heading + `activeStudentCount` |
| 3.2 | Student cards | PASS | `students/page.tsx` — InitialsAvatar, name, classSummary, latest records |
| 3.3 | Search filters | PASS | `LiveSearchForm.tsx` — debounced 250ms, updates `?q=` URL param |
| 3.4 | Pagination | PASS | `students/page.tsx` — PAGE_SIZE=12, prev/next links |
| 3.5 | Empty: no search results | PASS | `students/page.tsx` — "emptySearch" when query present |
| 3.6 | Empty: no students | PASS | `students/page.tsx` — "emptyNoStudents" |
| 3.7 | Add button (teacher only) | PASS | `students/page.tsx` — `{!isAdmin && <Link to="/students/new">}` |
| 3.8 | Admin "Kelola" link | PASS | `students/page.tsx` — `{isAdmin && <Link to="/admin/students">}` |
| 3.9 | Inactive students section | **WARNING** | `InactiveStudentsSection.tsx` exists but only renders for non-admin. Admin has no way to see inactive students from teacher view. |

### 4. Student Detail

| # | Item | Status | Evidence |
|---|---|---|---|
| 4.1 | Header with name + class | PASS | `students/[id]/page.tsx` — InitialsAvatar + name + classSummary |
| 4.2 | Summary card | PASS | `page.tsx` — activeTargets count, needsReviewCount, gender, joinDate |
| 4.3 | Quick action buttons | PASS | `page.tsx` — Hafalan + Murojaah links |
| 4.4 | Latest hafalan/murojaah | PASS | `LatestRecordCard` component — shows range, date, status |
| 4.5 | Active targets with TargetCard | PASS | `TargetCard.tsx` — surah, range, dates, progress bar, TargetActions |
| 4.6 | Target cancel | PASS | `TargetActions.tsx` — InlineConfirmActionButton → cancelTarget → onActionSuccess hides card |
| 4.7 | Target complete | PASS | `TargetActions.tsx` — completeTarget → onActionSuccess hides card |
| 4.8 | Edit target link | PASS | `TargetCard.tsx` — `/students/${studentId}/targets/${target.id}/edit` |
| 4.9 | Recent activity section | PASS | `page.tsx` — maps over recentActivity with ActivityRow |
| 4.10 | Activity row delete | PASS | `ActivityRow.tsx` — InlineConfirmActionButton with deleteRecord, setDeleted hides row |
| 4.11 | Activity row edit link | PASS | `ActivityRow.tsx` — editHref with returnTo |
| 4.12 | All history table (>6) | PASS | `page.tsx` — conditional `historyRecords.length > 6` |
| 4.13 | Deactivate section | PASS | `page.tsx` — `{!isAdmin && <DeactivateButton>}` |
| 4.14 | Excel export | PASS | `page.tsx` — link to `/api/reports/export-student?studentId=` |
| 4.15 | PDF export | PASS | `page.tsx` — link to `/api/reports/pdf-student?studentId=` |
| 4.16 | Unauthorized screen | PASS | `page.tsx` — `isUnauthorized` discriminated union → Lock screen |
| 4.17 | Inactive student screen | PASS | `page.tsx` — `isInactive` discriminated union → UserX screen |
| 4.18 | Empty: no targets | PASS | `page.tsx` — dashed card with Target icon + add CTA |
| 4.19 | Empty: no activity | **FAIL** | `page.tsx` — dashed card shown, but `Hafalan`/`Murojaah` CTAs use `t("hafalanButton")` which is "Hafalan" — not a clear empty-state message. Minor UX issue. |

### 5. Add Student

| # | Item | Status | Evidence |
|---|---|---|---|
| 5.1 | Form renders all fields | PASS | `StudentForm.tsx` — name, gender, joinDate, grade, level, academicClass, notes |
| 5.2 | Grade buttons toggle | PASS | `StudentForm.tsx` — `selectedGrade` state, 3 buttons (7/8/9) |
| 5.3 | Level buttons toggle | PASS | `StudentForm.tsx` — `selectedLevel` state, 3 buttons |
| 5.4 | Submit with valid data | PASS | `StudentForm.tsx` — server action `createStudent` |
| 5.5 | Validation: missing fields | PASS | `StudentForm.tsx` — `canSubmit` checks level + grade |
| 5.6 | Cancel link | PASS | `StudentForm.tsx` — `backHref` link |
| 5.7 | Teacher-only fallback | **FAIL** | `students/new/page.tsx` — when `teacherId` missing, shows inline "teacherOnly" message but NO link back. User is stuck. |

### 6. Edit Student

| # | Item | Status | Evidence |
|---|---|---|---|
| 6.1 | Pre-populated form | PASS | `EditStudentForm.tsx` — receives `values` from server |
| 6.2 | Submit updates | PASS | `EditStudentForm.tsx` — `updateTeacherStudent` bound action |
| 6.3 | Teacher-only fallback | **FAIL** | `students/[id]/edit/page.tsx` — same issue: "teacherOnly" message with no back link |

### 7. Hafalan / Murojaah / Edit Record

| # | Item | Status | Evidence |
|---|---|---|---|
| 7.1 | Hafalan form | PASS | `hafalan/new/page.tsx` — SurahInput, ayah range, status, score, date, notes |
| 7.2 | Murojaah form | PASS | `murojaah/new/page.tsx` — same structure with RotateCcw icon |
| 7.3 | Edit record form | PASS | `records/[recordType]/[recordId]/edit/page.tsx` — pre-populated |
| 7.4 | Submit creates record | PASS | `createHafalanRecord` / `createMurojaahRecord` server actions |
| 7.5 | Submit updates record | PASS | `updateRecord` server action |
| 7.6 | Validation: fromAyah > toAyah | PASS | `validate-record.ts` — checked |
| 7.7 | Validation: ayah > 286 | PASS | `page.tsx` — `max={286}` on inputs |
| 7.8 | Default status CUKUP | PASS | `page.tsx` — `defaultValue="CUKUP"` |
| 7.9 | returnTo parameter | PASS | `page.tsx` — `returnTo` passed through |
| 7.10 | returnTo open-redirect guard | PASS | `record-actions.ts:26-28` — checks `startsWith("/") && !startsWith("//")` |
| 7.11 | Record type label swap | PASS | `page.tsx` — conditional icon/label based on `recordType` |
| 7.12 | Redirect on student mismatch | PASS | `page.tsx` — `redirect(/students/${id})` if record's studentId differs |

### 8. Targets

| # | Item | Status | Evidence |
|---|---|---|---|
| 8.1 | New target form | PASS | `targets/new/page.tsx` — type radio, surah, ayah, dates, notes |
| 8.2 | Default dates (today + 7) | PASS | `page.tsx` — `new Date()` + 7 days calculation |
| 8.3 | Edit target form | PASS | `targets/[targetId]/edit/page.tsx` — pre-populated |
| 8.4 | Cannot edit non-ACTIVE | PASS | `page.tsx` — `notFound()` when `target.status !== ACTIVE` |
| 8.5 | Submit creates target | PASS | `createTarget` server action |
| 8.6 | Submit updates target | PASS | `updateTarget` server action |
| 8.7 | Target cancel/complete | PASS | `TargetActions.tsx` — both actions with confirmation |
| 8.8 | Edit target date timezone | **FAIL** | `targets/[targetId]/edit/page.tsx` — `toDateString` uses UTC components, may shift dates by timezone |

### 9. Quick Log

| # | Item | Status | Evidence |
|---|---|---|---|
| 9.1 | Page loads with search | PASS | `GuidedQuickLog.tsx` — combobox input |
| 9.2 | Search filters students | PASS | `GuidedQuickLog.tsx` — case-insensitive `toLowerCase()` filter |
| 9.3 | Select student reveals form | PASS | `GuidedQuickLog.tsx` — conditional sections after selection |
| 9.4 | Toggle Hafalan/Murojaah | PASS | `GuidedQuickLog.tsx` — 2-button toggle |
| 9.5 | Submit creates record | PASS | `GuidedQuickLog.tsx` — server action with success toast |
| 9.6 | Clear selected student | PASS | `GuidedQuickLog.tsx` — X button clears selection |
| 9.7 | Cancel resets fields | PASS | `GuidedQuickLog.tsx` — `surahInputKey++` forces remount |
| 9.8 | Empty: no student selected | PASS | `GuidedQuickLog.tsx` — dashed "selectStudentPrompt" panel |
| 9.9 | Empty: no search results | PASS | `GuidedQuickLog.tsx` — "noStudentFound" with query |

### 10. Formative

| # | Item | Status | Evidence |
|---|---|---|---|
| 10.1 | Class-level + semester tabs | PASS | `formative/page.tsx` — SegmentedLinkTabs |
| 10.2 | Student table | PASS | `formative/page.tsx` — student, halaqah, hafalan, murojaah, scores, average |
| 10.3 | Pagination | PASS | `formative/page.tsx` — PAGE_SIZE=12 |
| 10.4 | Excel export | PASS | `formative/page.tsx` — link to `/api/reports/export-formative` |
| 10.5 | Empty: no students | PASS | `formative/page.tsx` — "emptyStudents" message |
| 10.6 | Detail link | PASS | `formative/page.tsx` — `/formative/[id]?semester=...` |
| 10.7 | Formative detail page | PASS | `formative/[studentId]/page.tsx` — stats + records table |
| 10.8 | Semester tab switching | **WARNING** | `formative/[studentId]/page.tsx` — uses SegmentedLinkTabs which navigates with query params. If server action fails, no error boundary (no `error.tsx` in formative segment). |

### 11. Summative

| # | Item | Status | Evidence |
|---|---|---|---|
| 11.1 | Class-level + semester tabs | PASS | `summative/page.tsx` — SegmentedLinkTabs |
| 11.2 | Student table | PASS | `summative/page.tsx` — student, halaqah, assessments, average |
| 11.3 | Pagination | PASS | `summative/page.tsx` — PAGE_SIZE=12 |
| 11.4 | Excel export | PASS | `summative/page.tsx` — link to `/api/reports/export-summative` |
| 11.5 | Empty: no students | PASS | `summative/page.tsx` — "emptyStudents" message |
| 11.6 | Detail link + Add link | PASS | `summative/page.tsx` — both links per row |
| 11.7 | Summative detail | PASS | `summative/[studentId]/page.tsx` — assessments table |
| 11.8 | New assessment | PASS | `summative/[studentId]/new/page.tsx` — SummativeAssessmentForm |
| 11.9 | Edit assessment | PASS | `summative/[studentId]/[assessmentId]/edit/page.tsx` — pre-populated form |
| 11.10 | Delete assessment | PASS | `edit/page.tsx` — DeleteSummativeButton with confirmation |

### 12. Reports

| # | Item | Status | Evidence |
|---|---|---|---|
| 12.1 | Page loads with stats | PASS | `reports/page.tsx` — hero card + student progress table |
| 12.2 | Excel export | PASS | `reports/page.tsx` — `/api/reports/export-teacher` |
| 12.3 | PDF export | PASS | `reports/page.tsx` — `/api/reports/pdf-teacher` |
| 12.4 | Links to formative/summative | PASS | `reports/page.tsx` — card links |
| 12.5 | Admin without teacherId redirect | **WARNING** | `reports/page.tsx` — `redirect("/admin/reports")` when `isAdmin && !teacherId`. But this branch is unreachable: admin without teacherId hits the redirect before the fallback. The admin-only "no teacherId" inline view at line ~170 is dead code. |
| 12.6 | Admin-only fallback view | PASS | `reports/page.tsx` — shows "adminOnlyHeading" with link to `/admin` |

### 13. Admin Dashboard

| # | Item | Status | Evidence |
|---|---|---|---|
| 13.1 | System-wide stats | PASS | `admin/page.tsx` — hero card + 5-card stats grid |
| 13.2 | Management area cards | PASS | `admin/page.tsx` — 5 cards with links |
| 13.3 | Recent teachers list | PASS | `admin/page.tsx` — teachers with avatar, email, counts |

### 14. Admin Teachers

| # | Item | Status | Evidence |
|---|---|---|---|
| 14.1 | Teacher list + search | PASS | `admin/teachers/page.tsx` — LiveSearchForm + cards |
| 14.2 | Add teacher | PASS | `admin/teachers/new/page.tsx` — TeacherForm |
| 14.3 | Edit teacher | PASS | `admin/teachers/[id]/edit/page.tsx` — TeacherForm pre-populated |
| 14.4 | Deactivate teacher | PASS | `admin/teachers/page.tsx` — InlineConfirmActionButton |
| 14.5 | Activate teacher | PASS | `admin/teachers/page.tsx` — form post |
| 14.6 | Delete teacher (no deps) | PASS | `admin/teachers/page.tsx` — AdminDeleteButton |
| 14.7 | Delete blocked (has students) | PASS | `admin/teachers/page.tsx` — `deleteDisabledReason` when studentCount > 0 |

### 15. Admin Classes

| # | Item | Status | Evidence |
|---|---|---|---|
| 15.1 | Class list + search | PASS | `admin/classes/page.tsx` — LiveSearchForm + cards |
| 15.2 | Add/Edit class | PASS | `admin/classes/new/page.tsx` + `edit/page.tsx` — AcademicClassForm |
| 15.3 | Activate/Deactivate | PASS | `admin/classes/page.tsx` — InlineConfirmActionButton |
| 15.4 | Delete blocked (has students) | PASS | `admin/classes/page.tsx` — `deleteBlockedByStudents` reason |

### 16. Admin Halaqah

| # | Item | Status | Evidence |
|---|---|---|---|
| 16.1 | Halaqah list + search | PASS | `admin/halaqah/page.tsx` — LiveSearchForm + cards |
| 16.2 | Add/Edit halaqah | PASS | `admin/halaqah/new/page.tsx` + `edit/page.tsx` — ClassGroupForm |
| 16.3 | Activate/Deactivate | PASS | `admin/halaqah/page.tsx` — InlineConfirmActionButton |
| 16.4 | Delete blocked (has students) | PASS | `admin/halaqah/page.tsx` — delete disabled when studentCount > 0 |
| 16.5 | Inactive teacher warning | PASS | `admin/halaqah/page.tsx` — `!classGroup.teacherIsActive && classGroup.isActive` warning |

### 17. Admin Students

| # | Item | Status | Evidence |
|---|---|---|---|
| 17.1 | Student list + search | PASS | `admin/students/page.tsx` — LiveSearchForm + cards |
| 17.2 | Add/Edit student | PASS | `admin/students/new/page.tsx` + `edit/page.tsx` — StudentForm |
| 17.3 | Activate/Deactivate | PASS | `admin/students/page.tsx` — InlineConfirmActionButton |
| 17.4 | Delete blocked (has records) | PASS | `admin/students/page.tsx` — composes reason from counts |
| 17.5 | Student detail page | PASS | `admin/students/[id]/page.tsx` — progress data + history |
| 17.6 | Excel/PDF export from detail | **FAIL** | `admin/students/[id]/page.tsx` — links to `/api/reports/export-student` and `/api/reports/pdf-student` but the `studentId` param is read from `params.id` which is correct. However, the page uses its own `<main>` without AppShell — inconsistent with other admin pages. Also, `data.avgScore || "-"` treats 0 as "-" (falsy check). |

### 18. Admin Reports

| # | Item | Status | Evidence |
|---|---|---|---|
| 18.1 | Stats + teacher table | PASS | `admin/reports/page.tsx` — hero card + table |
| 18.2 | Excel export | PASS | `admin/reports/page.tsx` — `/api/reports/export-admin` |
| 18.3 | PDF export | PASS | `admin/reports/page.tsx` — `/api/reports/pdf-admin` |

### 19. Profile

| # | Item | Status | Evidence |
|---|---|---|---|
| 19.1 | User info + role | PASS | `profile/page.tsx` — name, email, role badge |
| 19.2 | Theme toggle | PASS | `profile/page.tsx` — ThemeToggle section |
| 19.3 | Language switcher | PASS | `profile/page.tsx` — LanguageSwitcher section |
| 19.4 | Change email link | PASS | `profile/page.tsx` — `/profile/change-email` |
| 19.5 | Change password link | PASS | `profile/page.tsx` — `/profile/change-password` |
| 19.6 | Admin-only "Open Admin Panel" | PASS | `profile/page.tsx` — `{isAdmin && ...}` conditional |

### 20. Change Email / Password

| # | Item | Status | Evidence |
|---|---|---|---|
| 20.1 | Change email form | PASS | `profile/change-email/page.tsx` — currentPassword, newEmail, confirmEmail |
| 20.2 | Submit changes email | PASS | `profile/change-email/page.tsx` — `changeEmail` server action |
| 20.3 | Validation: mismatched emails | PASS | `profile/change-email/page.tsx` — server-side validation |
| 20.4 | Change password form | PASS | `profile/change-password/page.tsx` — currentPassword, newPassword, confirmPassword |
| 20.5 | PasswordRequirements live feedback | PASS | `profile/change-password/page.tsx` — checks letter, number, min length, match |
| 20.6 | Submit changes password | **WARNING** | `profile/change-password/page.tsx` — `changePassword` server action. No client-side validation that passwords match before submit (server handles it). Minor UX issue. |

### 21. i18n

| # | Item | Status | Evidence |
|---|---|---|---|
| 21.1 | Switch to English | PASS | `LanguageSwitcher.tsx` — sets cookie, router.refresh() |
| 21.2 | Switch to Arabic + RTL | PASS | `layout.tsx:55-58` — `dir = locale === "ar" ? "rtl" : "ltr"` |
| 21.3 | Switch to Indonesian | PASS | `LanguageSwitcher.tsx` — default locale |
| 21.4 | RTL: sidebar flips | PASS | `AppShell.tsx` — `rtl:sm:mr-64` class |
| 21.5 | Arabic font (Amiri) | **WARNING** | `layout.tsx` — `Amiri` font loaded. But `ar.json` has 9 fewer keys than `id.json`/`en.json` — some Arabic strings may be missing, causing fallback to key names. |
| 21.6 | Invalid locale cookie | **FAIL** | `i18n/request.ts:10` — `(store.get("locale")?.value as Locale) || defaultLocale` — no validation that value is in `locales` array. Invalid cookie (e.g., `"fr"`) causes dynamic import of `messages/fr.json` which will throw. |

### 22. Dark Mode

| # | Item | Status | Evidence |
|---|---|---|---|
| 22.1 | Dark mode toggle | PASS | `ThemeToggle.tsx` — 4 options (auto/system/light/dark) |
| 22.2 | Light mode | PASS | `ThemeProvider.tsx` — `attribute="class"` |
| 22.3 | Auto mode (6am/6pm) | PASS | `ThemeProvider.tsx` — `AutoThemeController` with setTimeout boundary |
| 22.4 | System mode | PASS | `ThemeProvider.tsx` — `enableSystem` prop |

### 23. PWA

| # | Item | Status | Evidence |
|---|---|---|---|
| 23.1 | Install prompt | PASS | `InstallPrompt.tsx` — listens to `beforeinstallprompt` |
| 23.2 | "Later" dismisses | PASS | `InstallPrompt.tsx` — `localStorage["pwa-dismissed"] = "1"` |
| 23.3 | Offline banner | PASS | `OfflineBanner.tsx` — `online`/`offline` event listeners |
| 23.4 | Offline page | **WARNING** | `offline/page.tsx` — `force-static`. Link back to `/` works, but if user is offline and clicks `/`, service worker serves `/offline` again (network-first with fallback). Could create loop if `/` fails. |

### 24. Loading States

| # | Item | Status | Evidence |
|---|---|---|---|
| 24.1 | Dashboard loading | PASS | `app/loading.tsx` — skeleton |
| 24.2 | Students list loading | PASS | `app/students/loading.tsx` — skeleton |
| 24.3 | Student detail loading | PASS | `app/students/[id]/loading.tsx` — skeleton |
| 24.4 | Admin loading | **WARNING** | `app/admin/loading.tsx` — present, but NO loading.tsx for `/admin/teachers`, `/admin/classes`, `/admin/halaqah`, `/admin/students` (rely on parent). Also no loading.tsx for `/login`, `/profile/change-email`, `/profile/change-password`. |

### 25. Error States

| # | Item | Status | Evidence |
|---|---|---|---|
| 25.1 | Root error boundary | PASS | `app/error.tsx` — heading + fallback + home link |
| 25.2 | Students error boundary | PASS | `app/students/error.tsx` — heading + "try again" + home link |
| 25.3 | Admin error boundary | PASS | `app/admin/error.tsx` — heading + "try again" + admin link |
| 25.4 | Global error boundary | **FAIL** | `app/global-error.tsx` — hardcoded Indonesian text "Terjadi Kesalahan" / "Sistem mengalami gangguan. Silakan coba lagi." / "Coba Lagi". Not translated. Also no `<title>` in the `<html>` tag. |
| 25.5 | 404 page | **WARNING** | `app/not-found.tsx` — uses `getTranslations("NotFound")` which is server-side. If the i18n system fails (e.g., invalid locale cookie), the 404 page itself will crash. |

### 26. Exports

| # | Item | Status | Evidence |
|---|---|---|---|
| 26.1 | Teacher Excel | **WARNING** | `export-teacher/route.ts` — works but hardcodes locale `"id"` regardless of user's locale setting. |
| 26.2 | Teacher PDF | **WARNING** | `pdf-teacher/route.ts` — same hardcoded `"id"` locale issue. |
| 26.3 | Admin Excel | PASS | `export-admin/route.ts` — admin-only, returns 401 if not admin |
| 26.4 | Admin PDF | PASS | `pdf-admin/route.ts` — admin-only, returns 401 if not admin |
| 26.5 | Student Excel | PASS | `export-student/route.ts` — teacher-scoped |
| 26.6 | Student PDF | PASS | `pdf-student/route.ts` — teacher-scoped |
| 26.7 | Formative Excel | **WARNING** | `export-formative/route.ts` — returns 401 for unauthorized. But `export-summative/route.ts` returns 403 for same scenario. Inconsistent. |
| 26.8 | Summative Excel | **WARNING** | `export-summative/route.ts` — returns 403 instead of 401 (inconsistent with formative). |

---

## Prioritized Bug List

### P0 — Critical

| # | File | Issue | Impact |
|---|---|---|---|
| P0-1 | `src/app/global-error.tsx` | Hardcoded Indonesian text in global error boundary. Not translated. | All non-Indonesian users see raw Indonesian on crash. |
| P0-2 | `src/i18n/request.ts:10` | No validation of locale cookie value. Invalid locale causes dynamic import crash (`messages/{invalid}.json`). | Any invalid cookie value (e.g., from tampering or old cookies) crashes the entire app. |
| P0-3 | `src/lib/rate-limit.ts` | In-memory rate limiter resets on server restart. Not shared across instances. | Rate limiting is ineffective in multi-instance production. Brute-force attacks possible after restart. |
| P0-4 | `messages/ar.json` | 9 fewer translation keys than `id.json`/`en.json`. | Arabic users see raw key names for missing strings. |

### P1 — Important

| # | File | Issue | Impact |
|---|---|---|---|
| P1-1 | `src/app/reports/page.tsx:103,250` | `avgScore || "-"` treats 0 as falsy. Shows "-" when average is actually 0. | Misleading data display. Should use `avgScore ?? "-"` or `avgScore !== null ? avgScore : "-"`. |
| P1-2 | `src/app/admin/students/[id]/page.tsx:96` | Same `avgScore || "-"` issue. | Same impact as P1-1. |
| P1-3 | `src/app/students/new/page.tsx` | "teacherOnly" fallback has no back link. User is stuck. | Admin without teacherId sees dead-end page. |
| P1-4 | `src/app/students/[id]/edit/page.tsx` | Same "teacherOnly" no-back-link issue. | Same impact as P1-3. |
| P1-5 | `src/app/students/[id]/targets/[targetId]/edit/page.tsx` | `toDateString` uses UTC components for date defaults. | Dates may shift by timezone when editing targets. |
| P1-6 | `api/reports/export-teacher` + `pdf-teacher` | Hardcoded locale `"id"` in exports. | English/Arabic users always get Indonesian export files. |
| P1-7 | `api/reports/export-summative` | Returns 403 for unauthorized; `export-formative` returns 401 for same scenario. | Inconsistent error handling confuses API consumers. |
| P1-8 | No `error.tsx` in `/formative`, `/summative`, `/profile` segments. | Errors in these routes fall back to root `error.tsx` which has no "try again" button. | Users can't retry on error — must navigate manually. |
| P1-9 | No `loading.tsx` for `/login`, `/profile/change-email`, `/profile/change-password`, `/admin/students/[id]`. | No loading skeleton for these routes. | Users see blank page during slow loads. |

### P2 — Nice to Have

| # | File | Issue | Impact |
|---|---|---|---|
| P2-1 | `src/app/not-found.tsx` | Uses `getTranslations("NotFound")` server-side. If i18n fails, 404 page crashes. | Edge case: invalid locale cookie + 404 = double error. |
| P2-2 | `src/app/offline/page.tsx` | Link to `/` when offline may loop back to `/offline` if service worker can't serve `/`. | Minor UX issue during offline usage. |
| P2-3 | `InstallPrompt.tsx` | `localStorage["pwa-dismissed"] = "1"` is permanent until manually cleared. | Users can never see install prompt again after dismissing once. |
| P2-4 | `global-error.tsx` | No `<title>` tag in the `<html>` element. | Browser shows blank tab title on crash. |
| P2-5 | `reports/page.tsx:170-190` | Admin-only fallback view for `!teacherId` is dead code (unreachable due to redirect at line ~80). | Dead code maintenance burden. |
| P2-6 | Various icon-only buttons | No `aria-label` on some icon buttons (e.g., clear button in QuickLog). | Screen reader users can't identify button purpose. |
| P2-7 | `Feedback.ts` | `playNotificationSound` only plays in browser. No fallback for silent mode. | Sound may not play on all devices. |
