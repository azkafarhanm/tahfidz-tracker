# Phase 3B Workflow Persistence Audit

Date: 2026-07-05  
Scope: Frequent Teacher and Admin workflow persistence only.  
Status: Audit only; no application implementation.

Phase 3A already covers primary navigation and the Students, Formative, and
Summative list/detail Back workflows. The following are the five remaining
workflow-persistence candidates with the strongest day-to-day value.

| Priority | Current workflow | Current friction | Why persistence would help | Expected UX improvement | Complexity |
|---|---|---|---|---|---|
| 1 | Teacher Student Detail or Formative Detail → Edit Memorization/Revision Record → Save/Cancel | The existing safe `returnTo` reaches the correct parent, but Save returns near the top and does not reveal the edited row. | Reusing the existing record ID highlight would return the teacher directly to the item just changed. | Immediate confirmation of the edit and less rescanning of long activity tables. | Low |
| 2 | Admin Students directory → Student Detail/Edit → Save/Back | Only `programType` survives. Search, pagination, scroll, selected student, and whether Edit began from list or detail are lost. | Preserving the exact local origin would keep admins inside the same working set during repeated corrections. | Removes repeated searching and paging; returns directly to the edited student or originating detail. | Medium |
| 3 | Admin Teachers directory → Edit Teacher → Save/Back | Save, Cancel, and Back return to the unfiltered first page, losing search, pagination, scroll, and teacher position. | Retaining the directory origin would make consecutive teacher-account updates substantially faster. | Avoids re-entering a teacher search and relocating the edited card after every change. | Medium |
| 4 | Summative Student Detail → Add/Edit Assessment → Save/Cancel | Semester is retained, but return lands at the top of detail and the created/edited assessment is not selected. | Returning to the assessment row would preserve the teacher's position in a common grading workflow. | Faster confirmation and smoother entry/review of multiple assessments for one student. | Low |
| 5 | Admin Students or Teachers filtered directory → Activate/Deactivate/Delete → Return | Mutation redirects discard search, pagination, and scroll; the admin must reconstruct the working set after each action. | Preserving valid directory context would support repeated account/student maintenance without changing mutation behavior. | Fewer clicks during bulk-like maintenance; deletion can retain filters and move to the nearest valid page/position. | Medium |

## Recommendation

Implement in priority order and stop after each candidate is manually validated.
Candidates 1 and 4 can reuse existing highlighted-item behavior. Candidates 2,
3, and 5 should reuse the Phase 3A workflow link, Navigation Context Persistence,
Scroll Persistence, and validated local return destinations. No new persistence
store or architecture is recommended.

## Candidate 1 follow-up: detail-page scroll on Cancel

QA scope: a regression was reported where, after Teacher → Student Detail → Edit
Record → Cancel, the user returns to the top of Student Detail and the previous
scroll position is lost.

This is **out of scope for Candidate 1** and is not a regression introduced by it:

- Candidate 1 added `highlight=<recordId>` to the **Save** success redirect only
  (`web/src/lib/record-actions.ts`, `updateRecord`). The Cancel path uses plain
  `<Link>` elements and was not modified.
- The pre-existing scroll behavior on return is governed by Phase 3A Scroll
  Persistence, which by design restores only top-level primary-navigation panels.
  See `docs/PERSISTENCE_ARCHITECTURE.md` ("does not … restore detail, edit, …
  flows") and the whitelist in `web/src/hooks/usePanelScrollRestoration.ts`
  (derived from `teacherNavigationItems` / `adminNavigationItems`, which are
  list routes only). `/students/[id]` is a detail route and is intentionally
  excluded, so its scroll position is neither saved on departure nor restored on
  arrival by the existing layer.

Accepted scope for Candidate 1 remains the **Save** workflow: return to the
edited record with highlight via the existing `ScrollToHighlightedItem` +
`data-highlight` machinery. Detail-page scroll restoration after Cancel is
logged here as a **future persistence improvement** and would require either a
narrow, additive detail-to-detail scroll mechanism or an explicit scope change
to the Phase 3A Scroll Persistence whitelist. It is not bundled into this
candidate and the current implementation is left unchanged.

## Excluded from this audit

Cache, performance optimization, database/Prisma work, transactions, exports,
audit logs, architecture refactoring, archive/restore, academic-year management,
settings, and other low-frequency administrative workflows.
