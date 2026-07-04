# Persistence Architecture

This document describes the two independent persistence concerns used by
TahfidzFlow primary navigation. Both are client-side enhancements built around
Next.js App Router navigation. Neither changes authentication, authorization,
server data, or business logic.

## Design boundaries

The implementation is split by responsibility:

- Scroll Persistence remembers the vertical position of top-level panels.
- Navigation Context Persistence remembers URL-based page state such as search,
  filters, tabs, and pagination.

`NavigationLinks` is the coordination point because a primary-navigation click
is the final synchronous moment before App Router navigation begins. It calls
each module's public save function, but the modules do not import, call, or
share storage with each other.

The storage namespaces are intentionally separate:

- Scroll positions: `scroll:<pathname>`
- Navigation contexts: `ctx:<pathname>`
- One-shot scroll-navigation flag: `navScrollRestore`

All persistence uses `sessionStorage`. State is therefore isolated per browser
tab and is normally cleared when the tab closes. The public context operations
and the scroll save operation treat storage write failures as non-fatal.

## Scroll Persistence

### Responsibility

Scroll Persistence restores a user's vertical position when they leave a
top-level application panel through primary navigation and later return through
primary navigation. It does not preserve query parameters or restore detail,
edit, settings, refresh, redirect, or mutation flows.

The implementation lives in:

- `web/src/hooks/usePanelScrollRestoration.ts`
- `web/src/components/ScrollRestoration.tsx`
- The primary-navigation trigger in `web/src/components/NavigationLinks.tsx`

### Lifecycle and trigger

1. The user clicks a sidebar or bottom-navigation link.
2. `NavigationLinks` synchronously calls
   `markPrimaryNavigation(outgoingPathname)` before App Router commits the new
   route.
3. The function saves the outgoing panel's current `window.scrollY`, keyed by
   pathname, when that pathname is in the primary-panel whitelist.
4. It sets the one-shot `navScrollRestore` flag.
5. `ScrollRestoration`, mounted once in the root layout, observes pathname
   changes through `usePanelScrollRestoration()`.
6. On the incoming pathname, the hook consumes and immediately removes the
   one-shot flag. Restoration runs only when that flag was present and the
   destination is eligible.

Saving in the click handler is required. Saving in a post-navigation effect is
too late because Next.js may already have reset `window.scrollY` to zero.

### Storage

Each eligible panel is stored as:

```text
scroll:<pathname> = <rounded window.scrollY>
```

The key excludes the query string. Scroll position and navigation context are
separate concerns, and changing a dataset through search, filters, or pagination
must not create a second scroll-storage namespace.

The eligible panel set is derived from the shared teacher and admin navigation
items, with `/reports` included explicitly because it is reached through a
dashboard quick action.

### Restore timing

The hook first attempts an immediate restore. If Server Component streaming or
a loading skeleton means the document is not yet tall enough, a
`ResizeObserver` watches `document.documentElement` until the requested scroll
position becomes reachable.

Restoration is one-shot. The target is clamped to the live maximum scroll range
so a page that has become shorter cannot receive an invalid position. There is
no polling and no `MutationObserver`.

### Cleanup

The `ResizeObserver` disconnects immediately after a successful restore. A
three-second safety timer ends an unresolved attempt, and effect cleanup also
disconnects the observer and clears the timer when the pathname changes or the
component unmounts. The navigation flag is removed as soon as it is consumed,
preventing refreshes or later unrelated transitions from restoring stale
positions.

## Navigation Context Persistence

### Responsibility

Navigation Context Persistence restores the URL-based state of selected
top-level pages before navigation starts. It stores the complete outgoing query
string rather than understanding individual search, filter, tab, or pagination
parameters.

The implementation lives in:

- `web/src/hooks/useNavigationContext.ts`
- The primary-navigation integration in
  `web/src/components/NavigationLinks.tsx`

Eligible routes are explicitly registered in `CONTEXT_WHITELIST`. This keeps
the mechanism generic while limiting persistence to pages whose query strings
represent restorable UI context.

### Lifecycle

1. On a primary-navigation click, `NavigationLinks` calls
   `markNavigationContext(pathname, searchParams.toString())`.
2. The module stores the complete query string under the outgoing pathname when
   the route is eligible.
3. When navigation links render on the client, each destination pathname is
   passed to `readNavigationContext()`.
4. `mergeContextParams()` combines the stored context with the link's base
   destination.
5. The resulting `href` already contains the restored context when the user
   clicks it, so App Router performs one navigation and one Server Component
   render.

The client-mounted guard prevents browser-only `sessionStorage` state from
changing the server-rendered link markup during hydration.

### Storage

Each eligible route is stored as:

```text
ctx:<pathname> = <raw query string without the leading question mark>
```

The module does not select or parse route-specific parameter names when saving.
Consequently, every query parameter present at the time of the navigation click
is part of the saved context. Adding a new URL-based state parameter to an
already eligible page does not require a persistence-code change.

### Merge strategy

`mergeContextParams()` parses the base and stored query strings generically with
`URLSearchParams`. Parameters already present in the base destination take
precedence. Stored parameters only fill missing keys.

This precedence is important for explicit navigation context such as
`programType`: the current link destination wins over older stored state. The
merge contains no pathname-specific branches.

### Why Option B was chosen

Option B constructs the final destination `href` before navigation. It provides:

- One App Router navigation
- One Server Component render
- No intermediate URL
- No visible flicker
- No post-navigation correction
- Normal link semantics, including pre-navigation destination visibility

### Why `router.replace()` is intentionally avoided

A post-navigation `router.replace()` would first render the destination without
its restored context and then issue a second navigation with the saved query
string. That creates avoidable rendering, can produce visible state changes,
and complicates interaction with scroll restoration.

For this feature, `router.replace()` is therefore an architectural anti-pattern.
The restored query string must be part of the link before the original
navigation begins.

## Maintenance rules

- Do not make either persistence module import or call the other.
- Do not move saving into a post-navigation effect.
- Do not add `router.replace()` as a restoration step.
- Do not add pathname-specific branching to `NavigationLinks`.
- Add a route to `CONTEXT_WHITELIST` only when its query string represents UI
  context that should survive primary navigation.
- Keep scroll keys pathname-only and navigation-context keys separate.
- Preserve the one-shot observer cleanup and safety timeout.
- Verify changes with lint, typecheck, build, desktop navigation, and Android
  PWA navigation for both teacher and admin roles.
