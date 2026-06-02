# UAT Checklist — TahfidzFlow

Each item has PASS / FAIL criteria for manual verification.

---

## 1. Auth & Access Control

- [ ] Login page renders at `/login`
  - PASS: page loads with identifier + password fields
  - FAIL: 404 or blank page
- [ ] Login with valid admin credentials (`admin` / `2026`)
  - PASS: redirects to `/` with admin dashboard
  - FAIL: stays on login or shows error
- [ ] Login with valid teacher credentials (`teacher.demo@tahfidzflow.local` / `2026`)
  - PASS: redirects to `/` with teacher dashboard
  - FAIL: stays on login or shows error
- [ ] Login with invalid credentials
  - PASS: error toast + error message, stays on `/login`
  - FAIL: no feedback or silent failure
- [ ] Rate limiting after 5 failed logins
  - PASS: blocks further attempts for 15 minutes
  - FAIL: unlimited login attempts allowed
- [ ] Unauthenticated access to `/students`
  - PASS: redirects to `/login`
  - FAIL: shows page content or 500
- [ ] Unauthenticated access to `/api/reports/export-admin`
  - PASS: returns 401 JSON
  - FAIL: returns data or 500
- [ ] Teacher cannot access `/admin` pages
  - PASS: redirects to `/`
  - FAIL: shows admin dashboard
- [ ] Admin can access `/admin` pages
  - PASS: admin dashboard loads
  - FAIL: redirect or 403
- [ ] Logout via sidebar/bottom nav
  - PASS: redirects to `/login`, session cleared
  - FAIL: stays logged in or errors
- [ ] `?reauth=1` on `/login` forces sign-out
  - PASS: calls `signOut()` then shows login form
  - FAIL: skips sign-out, stale session persists

## 2. Teacher Dashboard (`/`)

- [ ] Dashboard loads with greeting + user name
  - PASS: shows personalized greeting + date
  - FAIL: blank header or missing name
- [ ] Today's record count displayed
  - PASS: number shows (0 if no records)
  - FAIL: section missing or errors
- [ ] Weekly target progress bar animates
  - PASS: bar width matches percentage, animates smoothly
  - FAIL: static or missing
- [ ] Quick actions grid: Hafalan, Murojaah, Catat Cepat, Formatif, Sumatif
  - PASS: 4-5 action buttons visible, each links correctly
  - FAIL: missing links or broken routes
- [ ] Admin-only "Admin" quick action visible for admin
  - PASS: admin sees /admin link, teacher does not
  - FAIL: teacher sees admin link
- [ ] Overdue targets section (conditional)
  - PASS: shows when targets are overdue, hides when none
  - FAIL: always hidden or always shown
- [ ] Recent activity feed
  - PASS: shows last records with date/status
  - FAIL: empty or error
- [ ] Empty state: no records
  - PASS: shows empty-state message
  - FAIL: crashes or blank
- [ ] Motivation card renders
  - PASS: card with ayah/hadith text visible
  - FAIL: missing or broken

## 3. Students List (`/students`)

- [ ] Page loads with heading + student count
  - PASS: shows "Santri" heading + active count
  - FAIL: blank or error
- [ ] Student cards show avatar, name, class, latest record
  - PASS: each card has InitialsAvatar, name, classSummary
  - FAIL: missing elements
- [ ] Search filters students by name
  - PASS: typing query filters list, URL updates with `?q=`
  - FAIL: search doesn't filter or URL doesn't update
- [ ] Pagination works for >12 students
  - PASS: prev/next buttons appear, page changes
  - FAIL: no pagination or broken
- [ ] Empty state: no search results
  - PASS: shows "emptySearch" message
  - FAIL: blank or error
- [ ] Empty state: no students at all
  - PASS: shows "emptyNoStudents" message
  - FAIL: blank
- [ ] "Add" button visible for teacher, hidden for admin
  - PASS: teacher sees `/students/new`, admin doesn't
  - FAIL: wrong visibility
- [ ] Admin "Kelola" link to `/admin/students`
  - PASS: admin sees link, teacher doesn't
  - FAIL: wrong visibility
- [ ] Inactive students section (non-admin only)
  - PASS: shows collapsed section when inactive students exist
  - FAIL: missing or always visible

## 4. Student Detail (`/students/[id]`)

- [ ] Page loads with student name, class, avatar
  - PASS: header shows name + classSummary + InitialsAvatar
  - FAIL: blank or error
- [ ] Summary card: active targets, needs-review count, gender, join date
  - PASS: all 4 fields populated
  - FAIL: missing fields
- [ ] Quick action buttons: Hafalan, Murojaah
  - PASS: both link to correct new-record pages
  - FAIL: broken links
- [ ] Latest hafalan / murojaah cards
  - PASS: show range, date, status (or "noRecordYet")
  - FAIL: missing or error
- [ ] Active targets section with TargetCard
  - PASS: cards show surah, range, dates, progress bar, actions
  - FAIL: missing or broken
- [ ] Target "Batalkan" (cancel) action
  - PASS: confirmation dialog → target removed from list + success toast
  - FAIL: target stays visible after cancel
- [ ] Target "Selesai" (complete) action
  - PASS: confirmation → target removed + success toast
  - FAIL: target stays visible after complete
- [ ] Edit target link
  - PASS: links to `/students/[id]/targets/[targetId]/edit`
  - FAIL: broken link
- [ ] Recent activity section
  - PASS: shows records with type, range, date, status, score
  - FAIL: missing or error
- [ ] Activity row: delete record
  - PASS: confirmation → row removed + success toast
  - FAIL: row stays or no feedback
- [ ] Activity row: edit link
  - PASS: links to edit page with returnTo
  - FAIL: broken link
- [ ] All history table (>6 records)
  - PASS: table with date/type/ayat/score/status columns
  - FAIL: missing table or broken
- [ ] Deactivate section (non-admin only)
  - PASS: shows deactivate button with confirmation
  - FAIL: missing or visible to admin
- [ ] Excel export button
  - PASS: downloads `.xlsx` file
  - FAIL: 404 or empty file
- [ ] PDF export button
  - PASS: downloads `.pdf` file
  - FAIL: 404 or empty file
- [ ] Unauthorized screen (wrong teacher's student)
  - PASS: shows Lock icon + "accessDenied" message
  - FAIL: shows data or 500
- [ ] Inactive student screen
  - PASS: shows UserX icon + reactivate option (own student)
  - FAIL: shows active data
- [ ] Empty state: no targets
  - PASS: dashed card with Target icon + add CTA
  - FAIL: blank
- [ ] Empty state: no recent activity
  - PASS: dashed card with Hafalan/Murojaah CTAs
  - FAIL: blank

## 5. Add Student (`/students/new`)

- [ ] Form renders with all fields
  - PASS: name, gender, joinDate, grade, level, academicClass, notes
  - FAIL: missing fields
- [ ] Grade buttons (7/8/9) toggle correctly
  - PASS: selecting grade enables level selection
  - FAIL: no interaction
- [ ] Level buttons (Low/Medium/High) toggle correctly
  - PASS: selecting level shows class group name
  - FAIL: no feedback
- [ ] Submit with valid data
  - PASS: redirects to `/students` or student detail + success toast
  - FAIL: stays on form or error
- [ ] Submit with missing required fields
  - PASS: validation error shown via FormAlert
  - FAIL: submits empty data
- [ ] Cancel link returns to students list
  - PASS: navigates to `/students`
  - FAIL: broken link
- [ ] Teacher-only: admin without teacherId sees fallback
  - PASS: shows "teacherOnly" message
  - FAIL: shows form or errors

## 6. Edit Student (`/students/[id]/edit`)

- [ ] Form pre-populated with existing data
  - PASS: all fields show current values
  - FAIL: empty fields
- [ ] Submit updates student
  - PASS: redirects to student detail + success toast
  - FAIL: stays on form or error
- [ ] Teacher-only access
  - PASS: admin without teacherId sees fallback
  - FAIL: shows form or errors

## 7. New Hafalan (`/students/[id]/hafalan/new`)

- [ ] Form renders with SurahInput, ayah range, status, score, date, notes
  - PASS: all fields present
  - FAIL: missing fields
- [ ] Submit with valid data
  - PASS: redirects to student detail + success toast
  - FAIL: stays on form or error
- [ ] Validation: fromAyah > toAyah
  - PASS: error message shown
  - FAIL: submits invalid range
- [ ] Validation: ayah > 286
  - PASS: error message shown
  - FAIL: submits out-of-range value
- [ ] Default status is "CUKUP"
  - PASS: status select shows CUKUP
  - FAIL: empty or wrong default

## 8. New Murojaah (`/students/[id]/murojaah/new`)

- [ ] Same as Hafalan but with Murojaah-specific labels
  - PASS: title/icon/labels differ from Hafalan
  - FAIL: identical to Hafalan

## 9. Edit Record (`/students/[id]/records/[recordType]/[recordId]/edit`)

- [ ] Form pre-populated with existing record data
  - PASS: surah, ayah range, status, score, date, notes all filled
  - FAIL: empty fields
- [ ] Submit updates record
  - PASS: redirects to returnTo or student detail + success toast
  - FAIL: stays on form or error
- [ ] returnTo parameter honored
  - PASS: redirects to returnTo URL after save
  - FAIL: always redirects to student detail
- [ ] returnTo open-redirect guard
  - PASS: rejects `//evil.com` paths
  - FAIL: allows external redirect

## 10. New Target (`/students/[id]/targets/new`)

- [ ] Form renders with type radio, surah, ayah range, dates, notes
  - PASS: all fields present
  - FAIL: missing fields
- [ ] Default dates: today + 7 days
  - PASS: startDate = today, endDate = today+7
  - FAIL: empty or wrong dates
- [ ] Submit creates target
  - PASS: redirects to student detail + success toast
  - FAIL: stays on form or error

## 11. Edit Target (`/students/[id]/targets/[targetId]/edit`)

- [ ] Form pre-populated with existing target data
  - PASS: type, surah, ayah range, dates, notes filled
  - FAIL: empty fields
- [ ] Cannot edit non-ACTIVE target
  - PASS: returns notFound for cancelled/completed targets
  - FAIL: shows edit form
- [ ] Submit updates target
  - PASS: redirects to student detail + success toast
  - FAIL: stays on form or error

## 12. Quick Log (`/quick-log`)

- [ ] Page loads with student search
  - PASS: combobox input visible
  - FAIL: blank page
- [ ] Search filters students
  - PASS: typing filters dropdown list
  - FAIL: no filtering
- [ ] Select student reveals record form
  - PASS: form sections appear after selection
  - FAIL: form stays hidden
- [ ] Toggle Hafalan/Murojaah
  - PASS: type switches correctly
  - FAIL: no change
- [ ] Submit creates record
  - PASS: success toast + form resets
  - FAIL: error or no feedback
- [ ] Clear selected student
  - PASS: X button clears selection, form hides
  - FAIL: no clear option
- [ ] Cancel resets all fields
  - PASS: all fields cleared, student deselected
  - FAIL: fields retain values
- [ ] Empty state: no student selected
  - PASS: shows "selectStudentPrompt" dashed panel
  - FAIL: form visible without selection
- [ ] Empty search results
  - PASS: shows "noStudentFound" with query
  - FAIL: blank dropdown

## 13. Formative Recap (`/formative`)

- [ ] Page loads with class-level tabs (7/8/9) + semester tabs
  - PASS: segmented tabs visible and functional
  - FAIL: missing tabs
- [ ] Student table shows hafalan/murojaah scores + averages
  - PASS: table with all columns populated
  - FAIL: empty or missing columns
- [ ] Pagination works
  - PASS: prev/next when >12 students
  - FAIL: no pagination
- [ ] Excel export
  - PASS: downloads `.xlsx` with formative data
  - FAIL: 404 or empty file
- [ ] Empty state: no students
  - PASS: shows "emptyStudents" message
  - FAIL: blank
- [ ] Detail link per student
  - PASS: navigates to `/formative/[studentId]?semester=...`
  - FAIL: broken link

## 14. Formative Detail (`/formative/[studentId]`)

- [ ] Page loads with student stats
  - PASS: assessmentCount, hafalan, murojaah, average shown
  - FAIL: missing stats
- [ ] Records table renders
  - PASS: table with daily scores
  - FAIL: empty or error
- [ ] Semester tab switching
  - PASS: data changes when semester toggled
  - FAIL: no change

## 15. Summative Overview (`/summative`)

- [ ] Page loads with class-level + semester tabs
  - PASS: tabs functional
  - FAIL: missing
- [ ] Student table with total assessments + averages
  - PASS: table populated
  - FAIL: empty
- [ ] "Add" and "Detail" links per student
  - PASS: both navigate correctly
  - FAIL: broken links
- [ ] Excel export
  - PASS: downloads `.xlsx`
  - FAIL: 404 or empty

## 16. Summative Detail (`/summative/[studentId]`)

- [ ] Assessments table renders
  - PASS: table with surah, score, notes
  - FAIL: empty or error
- [ ] Add new assessment link
  - PASS: navigates to `/summative/[studentId]/new`
  - FAIL: broken link
- [ ] Edit assessment link
  - PASS: navigates to edit page
  - FAIL: broken link

## 17. New Summative Assessment (`/summative/[studentId]/new`)

- [ ] Form renders with surah, score, notes, semester
  - PASS: all fields present
  - FAIL: missing fields
- [ ] Submit creates assessment
  - PASS: redirects to summative detail + success toast
  - FAIL: stays on form or error

## 18. Edit Summative Assessment (`/summative/[studentId]/[assessmentId]/edit`)

- [ ] Form pre-populated
  - PASS: surah, score, notes, semester filled
  - FAIL: empty
- [ ] Submit updates assessment
  - PASS: redirects to detail + success toast
  - FAIL: error
- [ ] Delete assessment
  - PASS: confirmation → redirects + success toast
  - FAIL: no feedback or error

## 19. Teacher Reports (`/reports`)

- [ ] Page loads with stats + student progress table
  - PASS: hero card + table populated
  - FAIL: blank
- [ ] Excel export
  - PASS: downloads `.xlsx`
  - FAIL: 404 or empty
- [ ] PDF export
  - PASS: downloads `.pdf`
  - FAIL: 404 or empty
- [ ] Links to formative and summative pages
  - PASS: both navigate correctly
  - FAIL: broken links
- [ ] Admin without teacherId → redirects to `/admin/reports`
  - PASS: redirect works
  - FAIL: shows empty page

## 20. Admin Dashboard (`/admin`)

- [ ] Page loads with system-wide stats
  - PASS: hero card + 5-card stats grid
  - FAIL: blank
- [ ] Management area cards (teachers, classes, halaqah, students, reports)
  - PASS: all 5 cards visible with links
  - FAIL: missing cards
- [ ] Recent teachers list
  - PASS: shows teachers with avatar, email, counts
  - FAIL: empty or error

## 21. Admin Teachers (`/admin/teachers`)

- [ ] Teacher list with search + pagination
  - PASS: cards with avatar, email, phone, student/halaqah counts
  - FAIL: blank or error
- [ ] Add teacher → `/admin/teachers/new`
  - PASS: form renders, submit creates teacher
  - FAIL: broken link or form error
- [ ] Edit teacher → `/admin/teachers/[id]/edit`
  - PASS: form pre-populated, submit updates
  - FAIL: broken or error
- [ ] Deactivate teacher
  - PASS: confirmation → teacher deactivated + success toast
  - FAIL: no feedback
- [ ] Activate teacher
  - PASS: form post → teacher activated
  - FAIL: no feedback
- [ ] Delete teacher (no students/halaqah)
  - PASS: confirmation → teacher deleted + success toast
  - FAIL: error or no feedback
- [ ] Delete teacher blocked (has students)
  - PASS: delete disabled with reason message
  - FAIL: allows deletion

## 22. Admin Classes (`/admin/classes`)

- [ ] Class list with search + pagination
  - PASS: cards with name, year, grade, student count
  - FAIL: blank
- [ ] Add/Edit class
  - PASS: form works correctly
  - FAIL: error
- [ ] Activate/Deactivate class
  - PASS: toggle works + toast
  - FAIL: no feedback
- [ ] Delete class blocked (has students)
  - PASS: delete disabled with reason
  - FAIL: allows deletion

## 23. Admin Halaqah (`/admin/halaqah`)

- [ ] Halaqah list with search + pagination
  - PASS: cards with name, teacher, grade, level, student count
  - FAIL: blank
- [ ] Add/Edit halaqah
  - PASS: form works correctly
  - FAIL: error
- [ ] Activate/Deactivate halaqah
  - PASS: toggle works + toast
  - FAIL: no feedback
- [ ] Delete halaqah blocked (has students)
  - PASS: delete disabled with reason
  - FAIL: allows deletion
- [ ] Inactive teacher warning on halaqah card
  - PASS: warning shown when teacher inactive but halaqah active
  - FAIL: no warning

## 24. Admin Students (`/admin/students`)

- [ ] Student list with search + pagination
  - PASS: cards with avatar, name, teacher, halaqah, class, counts
  - FAIL: blank
- [ ] Add/Edit student
  - PASS: form works correctly
  - FAIL: error
- [ ] Activate/Deactivate student
  - PASS: toggle works + toast
  - FAIL: no feedback
- [ ] Delete student blocked (has records/targets/scores)
  - PASS: delete disabled with reason
  - FAIL: allows deletion
- [ ] Student detail page (`/admin/students/[id]`)
  - PASS: shows progress data, targets, history table
  - FAIL: blank or error
- [ ] Excel/PDF export from student detail
  - PASS: downloads files
  - FAIL: 404 or empty

## 25. Admin Reports (`/admin/reports`)

- [ ] Page loads with system stats + teacher summary table
  - PASS: hero card + table populated
  - FAIL: blank
- [ ] Excel export
  - PASS: downloads `.xlsx` with admin data
  - FAIL: 404 or empty
- [ ] PDF export
  - PASS: downloads `.pdf`
  - FAIL: 404 or empty

## 26. Profile (`/profile`)

- [ ] Page loads with user info + role
  - PASS: name, email, role badge visible
  - FAIL: blank
- [ ] Theme toggle section
  - PASS: 4 options (auto/system/light/dark) work
  - FAIL: no toggle or broken
- [ ] Language switcher section
  - PASS: 3 languages (id/en/ar) switch correctly
  - FAIL: no switcher or broken
- [ ] Change email link
  - PASS: navigates to `/profile/change-email`
  - FAIL: broken link
- [ ] Change password link
  - PASS: navigates to `/profile/change-password`
  - FAIL: broken link
- [ ] Admin-only: "Open Admin Panel" button
  - PASS: visible to admin, hidden for teacher
  - FAIL: wrong visibility

## 27. Change Email (`/profile/change-email`)

- [ ] Form renders with currentPassword, newEmail, confirmEmail
  - PASS: all fields present
  - FAIL: missing fields
- [ ] Submit changes email
  - PASS: success toast + redirect to profile
  - FAIL: error or no feedback
- [ ] Validation: mismatched emails
  - PASS: error message shown
  - FAIL: submits mismatched

## 28. Change Password (`/profile/change-password`)

- [ ] Form renders with currentPassword, newPassword, confirmPassword
  - PASS: all fields present
  - FAIL: missing fields
- [ ] PasswordRequirements component shows live feedback
  - PASS: checks letter, number, min length, match
  - FAIL: no feedback
- [ ] Submit changes password
  - PASS: success toast + redirect to profile
  - FAIL: error or no feedback

## 29. i18n

- [ ] Switch to English
  - PASS: all UI text in English
  - FAIL: mixed or untranslated strings
- [ ] Switch to Arabic
  - PASS: all UI text in Arabic + RTL layout
  - FAIL: LTR or mixed
- [ ] Switch to Indonesian
  - PASS: all UI text in Indonesian
  - FAIL: mixed or untranslated
- [ ] RTL: sidebar on right side in Arabic
  - PASS: sidebar position flips
  - FAIL: stays on left
- [ ] RTL: Arabic font (Amiri) renders
  - PASS: Arabic text uses Amiri font
  - FAIL: default font

## 30. Dark Mode

- [ ] Toggle to dark mode
  - PASS: all pages render dark theme
  - FAIL: light theme persists
- [ ] Toggle to light mode
  - PASS: all pages render light theme
  - FAIL: dark theme persists
- [ ] Auto mode switches at 6am/6pm
  - PASS: theme changes at boundary
  - FAIL: no change
- [ ] System mode follows OS preference
  - PASS: matches OS setting
  - FAIL: doesn't match

## 31. PWA

- [ ] Install prompt appears (first visit)
  - PASS: custom install card shown
  - FAIL: no prompt
- [ ] "Later" dismisses prompt
  - PASS: prompt hidden, localStorage set
  - FAIL: prompt persists
- [ ] Offline banner appears when disconnected
  - PASS: WifiOff banner at top
  - FAIL: no banner
- [ ] Offline page loads when navigating offline
  - PASS: `/offline` page renders with link back
  - FAIL: browser error page

## 32. Loading States

- [ ] Dashboard loading skeleton
  - PASS: `loading.tsx` renders skeleton while data loads
  - FAIL: blank page during load
- [ ] Students list loading
  - PASS: skeleton visible
  - FAIL: blank
- [ ] Student detail loading
  - PASS: skeleton visible
  - FAIL: blank
- [ ] Admin pages loading
  - PASS: skeleton visible
  - FAIL: blank

## 33. Error States

- [ ] Root error boundary (`/error.tsx`)
  - PASS: shows error heading + fallback message + home link
  - FAIL: white screen or crash
- [ ] Students error boundary
  - PASS: shows error + "try again" button + home link
  - FAIL: white screen
- [ ] Admin error boundary
  - PASS: shows error + "try again" button + admin link
  - FAIL: white screen
- [ ] Global error boundary (`global-error.tsx`)
  - PASS: inline-styled error page (no Tailwind)
  - FAIL: white screen
- [ ] 404 page (`/not-found.tsx`)
  - PASS: shows 404 heading + translated message + home link
  - FAIL: default Next.js 404

## 34. Exports

- [ ] Teacher Excel export
  - PASS: `.xlsx` downloads with summary + student progress + formative + summative sheets
  - FAIL: 404, empty, or error
- [ ] Teacher PDF export
  - PASS: `.pdf` downloads with tables + stats
  - FAIL: 404, empty, or error
- [ ] Admin Excel export
  - PASS: `.xlsx` with summary + teacher data sheets
  - FAIL: 404, empty, or error
- [ ] Admin PDF export
  - PASS: `.pdf` with summary + teacher table
  - FAIL: 404, empty, or error
- [ ] Student Excel export
  - PASS: `.xlsx` with summary + history + targets + scores
  - FAIL: 404, empty, or error
- [ ] Student PDF export
  - PASS: `.pdf` with info + history + targets + scores
  - FAIL: 404, empty, or error
- [ ] Formative Excel export
  - PASS: `.xlsx` with info + summary + daily scores + detail
  - FAIL: 404, empty, or error
- [ ] Summative Excel export
  - PASS: `.xlsx` with info + summary + detail
  - FAIL: 404, empty, or error
