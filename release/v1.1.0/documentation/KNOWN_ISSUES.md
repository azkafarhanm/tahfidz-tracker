# Known Issues

There are no open P0 bugs.

All four original P0 issues have been resolved:

| ID | Issue | Resolution |
|---|---|---|
| P0-1 | `global-error.tsx` hardcoded Indonesian | Fixed — replaced with English fallback, added `<title>` |
| P0-2 | No locale cookie validation in `i18n/request.ts` | Fixed — added `locales.includes()` guard |
| P0-3 | In-memory rate limiter not production-safe | Fixed — Upstash Redis primary, in-memory fallback |
| P0-4 | `ar.json` missing 9 translation keys | Fixed — added all 9 Arabic translations in `StudentDetail` |

---

## Resolved Issues (for reference)

### P0-1: Global error boundary uses hardcoded Indonesian text (RESOLVED)

**File**: `web/src/app/global-error.tsx`
**Fix**: Replaced three Indonesian strings with English (`"Something went wrong"`, `"An unexpected error occurred. Please try again."`, `"Try Again"`). Added `<head><title>Error - TahfidzFlow</title></head>`.

### P0-2: No locale cookie validation (RESOLVED)

**File**: `web/src/i18n/request.ts`
**Fix**: Added `locales.includes()` validation before using cookie value. Invalid values silently fall back to `defaultLocale`.

### P0-3: In-memory rate limiter (RESOLVED)

**File**: `web/src/lib/rate-limit.ts`
**Fix**: Upstash Redis as primary store (when `KV_REST_API_URL` + `KV_REST_API_TOKEN` are set), in-memory `Map` as transparent fallback. Functions are now async.

### P0-4: Arabic locale missing 9 keys (RESOLVED)

**File**: `web/messages/ar.json`
**Fix**: Added `accessDeniedHeading`, `accessDeniedDescription`, `accessDeniedHelp`, `inactiveHeading`, `inactiveDescription`, `inactiveArchiveNote`, `inactiveOwnerHint`, `backToStudents`, `cancelReactivateButton` with Arabic translations.
