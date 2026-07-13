# Phase 3 High-Value Workflow Persistence Plan

Date: 2026-07-05  
Scope: Seven frequent Teacher and Admin workflows only.  
Status: Implementation plan; no application code changed.

## Direction

Phase 3 should extend persistence only where a user repeatedly moves from a working list/detail context into a child route and back. The existing Scroll Persistence, Navigation Context Persistence, `returnTo` handling, and highlighted-item scrolling remain the foundation. No new persistence architecture is needed.

## Workflow review

### 1. Teacher: Students List -> Student Detail -> Back

**Current behavior:** Student list rows open `/students/[id]`. The detail Back link reconstructs `/students?programType=...`.

**Current persistence behavior:** The program filter survives. Search (`q`), pagination (`page`), active/inactive tab (`status`), list scroll, and the originating student position do not. Existing primary-navigation persistence does not run on list-to-detail links.

**Missing persistence:** Exact list query context and list scroll/selected student.

**Meaningful UX improvement:** Yes. This is a frequent teacher loop, especially when reviewing students from search results or later pages.

**Recommended implementation approach:** Use one small reusable context-aware workflow link. On list departure, save the current `/students` query through Navigation Context Persistence and save its scroll through the existing Scroll Persistence mechanism. On Back, resolve the stored `/students` context, request restoration, and optionally add `highlight=<studentId>` using the existing highlighted-item behavior. Do not persist detail-page state.

**Risk level:** Low.

**Acceptance criteria:**

- Starting from any combination of `q`, `page`, `programType`, and `status`, Back returns to the same URL state.
- The viewport returns to the prior list position, with the same student visible.
- Direct visits to `/students/[id]` still fall back safely to the current program-based Students URL.
- Browser refresh and unrelated navigation do not restore stale workflow scroll.

### 2. Teacher: Student Detail -> Add Memorization/Revision Record -> Save -> Return

**Current behavior:** Save redirects to `/students/[id]` with a success message and `highlight=<newRecordId>`.

**Current persistence behavior:** `ScrollToHighlightedItem` locates the created record and scrolls it into view. This is more useful than restoring the pre-form viewport because it confirms the new record was added.

**Missing persistence:** None that materially improves this workflow.

**Meaningful UX improvement:** No additional persistence is justified.

**Recommended implementation approach:** **No change required.** Keep the existing created-record highlight and return behavior.

**Risk level:** Low.

**Acceptance criteria:**

- Memorization and revision Save return to the correct student.
- The newly created record is visible and highlighted.
- The success message remains visible.
- No old list, form, or detail scroll state overrides the new-record reveal.

### 3. Teacher: Student Detail -> Edit Record -> Save -> Return

**Current behavior:** The edit route accepts a validated local `returnTo`. Save returns to that route with a success message, but does not identify the edited record.

**Current persistence behavior:** The correct parent route is retained. On Student Detail, the page returns near the top instead of the edited activity row.

**Missing persistence:** Edited-record selection/position on Student Detail.

**Meaningful UX improvement:** Yes. The teacher should immediately see the result of the edit.

**Recommended implementation approach:** Extend the existing safe `returnTo` result by appending `highlight=<recordId>` on successful update. Reuse `ScrollToHighlightedItem` and the existing `data-highlight` attribute on activity rows. Do not add general detail-page scroll persistence.

**Risk level:** Low.

**Acceptance criteria:**

- Save returns to the same student detail route.
- The edited record is scrolled into view and highlighted.
- Existing `returnTo` behavior for a non-Student-Detail origin remains valid.
- Invalid or external `returnTo` values still fall back to the student detail route.

### 4. Teacher: Formative -> Student Detail -> Back

**Current behavior:** The overview passes semester, program, and reports origin into Formative student detail. Back rebuilds semester, class level, program, and reports origin.

**Current persistence behavior:** Filters are already good enough. Overview pagination and the originating student row/scroll are lost.

**Missing persistence:** `page`, overview scroll, and selected student.

**Meaningful UX improvement:** Yes. Teachers commonly review several students sequentially from one filtered class/semester page.

**Recommended implementation approach:** Apply the same reusable workflow-link behavior as Workflow 1. Save the exact `/formative` URL and scroll before opening a student; use it for Back and mark the originating student row for highlight restoration. Keep the current explicit semester/class/program handling as the direct-entry fallback.

**Risk level:** Medium, because filter cookies, URL filters, reports origin, pagination, and scroll must not conflict.

**Acceptance criteria:**

- Back restores semester, class level, program, `returnTo=reports` when present, and `page`.
- The originating student row is visible at the restored viewport.
- Changing semester inside student detail continues to return to the matching semester overview rather than stale context.
- Direct detail visits retain the current filter-based fallback.

### 5. Teacher: Summative -> Student Detail -> Back

**Current behavior:** The overview passes semester, program, and reports origin into Summative student detail. Back rebuilds semester, class level, program, and reports origin.

**Current persistence behavior:** Filters are already good enough. Overview pagination and the originating student row/scroll are lost.

**Missing persistence:** `page`, overview scroll, and selected student.

**Meaningful UX improvement:** Yes. This is the same repeated review pattern as Formative.

**Recommended implementation approach:** Reuse the same workflow-link implementation as Workflows 1 and 4. Store the exact `/summative` origin and scroll before drill-down; restore it on Back. Preserve the existing filter reconstruction as fallback for direct entry.

**Risk level:** Medium, for the same URL-filter and scroll-coordination reasons as Formative.

**Acceptance criteria:**

- Back restores semester, class level, program, reports origin, and `page`.
- The originating student row is visible at the restored viewport.
- Semester changes on detail do not restore an incompatible stale overview context.
- Direct detail visits continue to use the current safe fallback.

### 6. Admin: Students List -> Student Detail/Edit -> Save/Back

**Current behavior:** List-to-detail and list-to-edit links do not carry origin context. Detail Back reconstructs only `programType`. Edit Cancel/Back retains only program. Edit Save redirects to the Students directory with program only, even when editing began from detail.

**Current persistence behavior:** Program survives; search, page, list scroll, selected student, and list-vs-detail origin do not.

**Missing persistence:** Exact directory context plus whether Edit originated from the list or detail.

**Meaningful UX improvement:** Yes. Admins repeatedly inspect or correct students from searched/paginated directories.

**Recommended implementation approach:**

1. Use the reusable workflow link to save `/admin/students` navigation context and scroll when opening Detail or Edit.
2. Carry a validated local `returnTo` through Detail -> Edit, form Back/Cancel, and the update action.
3. On successful Save, return to the actual origin and add `highlight=<studentId>` when the origin is the directory.
4. Add highlighted-item support to Admin student cards, reusing the existing highlight hook rather than creating another selection system.

Do not change Create or other Admin student mutations in this phase.

**Risk level:** Medium. The shared form and server redirect must preserve validation-error behavior and reject unsafe return destinations.

**Acceptance criteria:**

- List -> Detail -> Back restores `q`, `page`, `programType`, scroll, and the originating student.
- List -> Edit -> Save/Back returns to that same list context.
- Detail -> Edit -> Save/Back returns to that same student detail, not the directory.
- Validation errors remain on Edit with entered values and the original safe return destination intact.
- Direct Detail/Edit visits retain current program-based fallbacks.

### 7. Admin: Teachers List -> Teacher Detail/Edit -> Save/Back

**Current behavior:** There is currently no Admin Teacher detail page; the implemented daily workflow is Teachers List -> Edit -> Save/Back. Edit links carry no origin. Save, Cancel, and Back return to bare `/admin/teachers`.

**Current persistence behavior:** Search, page, list scroll, and selected teacher are lost.

**Missing persistence:** Exact Teachers directory context and selected teacher for the existing Edit workflow.

**Meaningful UX improvement:** Yes. It prevents administrators from repeatedly re-entering a teacher search after small edits.

**Recommended implementation approach:** Apply the same validated `returnTo` and reusable workflow-link pattern used for Admin Students. Carry the origin through `TeacherForm`; Save/Back returns to it with `highlight=<teacherId>`. Add highlighted-item support to teacher cards using the existing hook. Do not add a Teacher detail route as part of persistence work.

**Risk level:** Medium. `TeacherForm` is shared by Create and Edit, so return behavior must be edit-only and must not affect Create.

**Acceptance criteria:**

- Teachers List -> Edit -> Save/Back restores `q`, `page`, list scroll, and the edited teacher position.
- Validation errors retain entered values and the safe return destination.
- Direct Edit visits fall back to `/admin/teachers`.
- Teacher Create behavior is unchanged.
- No Teacher detail route or unrelated Admin workflow is introduced.

## Minimal reusable implementation shape

1. Add one context-aware workflow-link primitive for list/detail transitions. It should call the existing Navigation Context and Scroll Persistence APIs rather than own new storage.
2. Expose only the minimal save/request-restore operations needed from Scroll Persistence; keep its current session-storage keys, route identities, one-shot restore flag, observer cleanup, and timeout.
3. Reuse one validated local `returnTo` convention for server-action round trips. Allow only same-application paths beginning with one `/`, with a safe route-specific fallback.
4. Reuse `ScrollToHighlightedItem` and `data-highlight` for selected rows/cards. Do not create a second selection persistence mechanism.
5. Prefer exact origin context while it is compatible with current detail filters; otherwise use the existing route-specific fallback.

## Implementation order

1. Shared workflow link and minimal Scroll Persistence API extension.
2. Teacher Students list/detail Back.
3. Formative and Summative overview/detail Back.
4. Teacher edited-record highlighting.
5. Admin Students detail/edit return context.
6. Admin Teachers edit return context.

## Explicitly out of scope

No work is proposed for Archive, Restore, Academic Year, Reports beyond preserving an already-present origin parameter, Profile, Quick Log, Halaqah, Classes, Export, Settings, Create workflows, or other low-frequency Admin operations.
