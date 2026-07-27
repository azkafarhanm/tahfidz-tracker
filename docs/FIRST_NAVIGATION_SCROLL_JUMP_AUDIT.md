# First Navigation Scroll Jump — Root Cause Report

## 1. Root cause

The recording `Screen Recording 2026-07-27 143630.mp4` proves that the failure
was a scroll-storage identity mismatch.

The first Student Detail URL was:

```text
/students/:id?programType=ACADEMIC&dashboardShortcut=murojaah&grade=8
```

`dashboardShortcut` was already excluded from the old identity, but `grade=8`
was not. The Murojaah click therefore saved the scroll under:

```text
/students/:id?grade=8&programType=ACADEMIC
```

The Murojaah form intentionally canonicalizes its Cancel destination to:

```text
/students/:id?programType=ACADEMIC
```

The returning Student Detail looked up that second identity. No value existed
under it, so the final restore was skipped even though the scroll position had
been saved correctly.

There was a second lifecycle defect: nested workflow leaves matched the old
`startsWith("/students/")` restorable-route check and could consume the
one-shot restore flag. That defect has also been corrected, but it was not
sufficient to fix the reproduced recording because the saved and restored
identities still differed.

## 2. Why only the first navigation failed

The first visit originates from the filtered Students URL and carries
`grade=8` into Student Detail. Cancel removes that list-only context and returns
to the canonical detail URL. After that first return, the browser is already on
the canonical URL. A second Detail → Murojaah → Cancel cycle saves and reads the
same identity, so it appears “warmed up”.

Navigation Context is not the cause: Student Detail paths are not in its
whitelist, and the relevant links do not request query-context restoration.
Browser `history.scrollRestoration`, React hydration, data queries, and server
cache initialization do not alter the identity. Cache/hydration warmth only
correlated with the URL becoming canonical after the first cycle.

## 3. Lifecycle before the fix

1. The Students filter URL passes `grade=8` to Student Detail.
2. Student Detail renders, hydrates, and the user scrolls.
3. Murojaah click saves the position under the detail identity containing
   `grade=8`.
4. The Murojaah leaf mounts. Before the route-policy correction it could also
   consume the pending restore flag.
5. Cancel navigates to the canonical detail URL containing only `programType`.
6. Student Detail data loads and its layout restore reads the canonical
   identity.
7. The stored target is `null` for that key, so the page remains at the App
   Router's top position.

## 4. Lifecycle after the fix

1. Every exact `/students/:id` URL is normalized to the same pathname-only
   scroll identity because its query parameters are navigation/feedback state,
   not a data-layout variant.
2. Student Detail scroll is saved under `/students/:id`, regardless of whether
   the first URL contains `grade`, `dashboardShortcut`, `returnTo`, or
   `programType`.
3. Hafalan, Murojaah, Tasmi, edit, and target leaves are non-restorable and do
   not consume the pending return intent.
4. Cancel returns to Student Detail.
5. The returning layout effect reads `/students/:id`, finds the saved target,
   consumes the flag, and performs the final restore.

No timeout, animation frame, delayed restore, duplicate `scrollTo`, or extra
restore pass was introduced.

## 5. Files changed

- `web/src/hooks/usePanelScrollRestoration.ts`
- `web/src/lib/scroll-restoration-policy.ts`
- `web/src/lib/scroll-restoration-policy.test.ts`
- `web/src/lib/scroll-lifecycle-trace.ts`
- `web/src/components/WorkflowContextLink.tsx`
- `web/src/hooks/useNavigationContext.ts`
- `web/src/app/students/[id]/StudentDetailLifecycleTrace.tsx`
- `web/src/app/students/[id]/page.tsx`

## 6. Regression review

The policy tests assert that Student Detail, Formative Detail, Summative Detail,
and Admin Student Detail remain eligible, while Hafalan, Murojaah, Tasmi, edit,
and target leaf routes are excluded. They also assert:

- filtered, workflow-return, and canonical Student Detail URLs share one
  identity;
- Students list filters remain separate identities;
- nested workflow routes are not collapsed into Student Detail;
- a pending flag survives a leaf mount and is consumed only by the returning
  detail panel.

The existing scroll application, document-height observation, browser scroll
restoration configuration, and highlight precedence are unchanged.

## Temporary trace

Development builds emit ordered `[ScrollLifecycleTrace #...]` events covering:

1. Student Detail mount.
2. Navigation Context load/save.
3. Scroll Context save and restore eligibility.
4. Workflow link hydration and resolved context.
5. Student Detail data hydration.
6. Final scroll restore.

The decisive post-fix sequence is:

1. `Scroll Context saved` with `identities: ["/students/:id"]`.
2. Leaf event with `restorable:false, consumesRestoreFlag:false`.
3. Returning Student Detail with `identity:"/students/:id"`,
   `savedTarget:<scrollY>`, and `consumesRestoreFlag:true`.
4. `Final scroll restore`.
