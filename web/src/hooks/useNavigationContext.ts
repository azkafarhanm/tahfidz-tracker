"use client";

/**
 * Navigation Context Persistence (Phase 2B).
 *
 * Architecture: Option B — NavigationLinks builds the destination URL
 * with saved query params BEFORE navigation begins. Single render, no flicker.
 *
 * - sessionStorage only (per-tab, cleared on tab close by the browser).
 * - Stores the outgoing page's query string keyed by pathname.
 * - On nav link construction, reads the stored query for the DESTINATION
 *   pathname and merges it into the href.
 * - Completely independent of usePanelScrollRestoration.
 * - Scoped to pages whose UI state is represented by URL query params.
 */

const CONTEXT_PREFIX = "ctx:";
const CONTEXT_WHITELIST = new Set<string>([
  "/students",
  "/formative",
  "/summative",
  "/quick-log",
  "/reports",
  "/admin/reports",
  "/admin/students",
  "/admin/teachers",
  "/admin/classes",
  "/admin/halaqah",
]);

function contextKey(pathname: string): string {
  return `${CONTEXT_PREFIX}${pathname}`;
}

/**
 * Save the current page's query string to sessionStorage.
 * Called from NavigationLinks onClick, alongside markPrimaryNavigation.
 */
export function markNavigationContext(
  outgoingPathname: string,
  queryString: string,
): void {
  if (typeof window === "undefined") return;
  if (!CONTEXT_WHITELIST.has(outgoingPathname)) return;
  try {
    sessionStorage.setItem(contextKey(outgoingPathname), queryString);
  } catch {
    // sessionStorage may be unavailable (private mode) — fail silently.
  }
}

/**
 * Include the latest visible search value when navigation happens before the
 * debounced URL update has committed.
 */
export function mergeVisibleSearchFormContext(queryString: string): string {
  if (typeof document === "undefined") return queryString;

  const searchForm = document.querySelector<HTMLFormElement>(
    'form[role="search"]',
  );
  if (!searchForm) return queryString;

  const params = new URLSearchParams(queryString);
  for (const [key, value] of new FormData(searchForm)) {
    if (typeof value !== "string") continue;
    const normalizedValue = value.trim();
    if (normalizedValue) {
      params.set(key, normalizedValue);
    } else {
      params.delete(key);
    }
  }
  return params.toString();
}

/**
 * Read the stored query string for a destination pathname.
 * Called during href construction in NavigationLinks.
 * Returns null if no stored context exists for the destination.
 */
export function readNavigationContext(pathname: string): string | null {
  if (typeof window === "undefined") return null;
  if (!CONTEXT_WHITELIST.has(pathname)) return null;
  try {
    return sessionStorage.getItem(contextKey(pathname));
  } catch {
    return null;
  }
}

/**
 * Merge stored query params into a base href.
 * Preserves params already present in the href (e.g. programType from
 * appendProgramType). Stored params only fill in MISSING ones.
 *
 * Example:
 *   base = "/students?programType=BOARDING"
 *   stored = "?q=ahmad&page=2"
 *   result = "/students?programType=BOARDING&q=ahmad&page=2"
 */
export function mergeContextParams(
  baseHref: string,
  storedQueryString: string | null,
): string {
  if (!storedQueryString) return baseHref;

  // Parse both into URLSearchParams for clean merging
  const [basePath, baseQuery] = baseHref.split("?");
  const baseParams = new URLSearchParams(baseQuery ?? "");
  const storedParams = new URLSearchParams(
    storedQueryString.startsWith("?")
      ? storedQueryString.slice(1)
      : storedQueryString,
  );

  // Only add params that aren't already in the href (base takes precedence)
  storedParams.forEach((value, key) => {
    if (!baseParams.has(key)) {
      baseParams.set(key, value);
    }
  });

  const merged = baseParams.toString();
  return merged ? `${basePath}?${merged}` : basePath;
}
