"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  teacherNavigationItems,
  adminNavigationItems,
} from "@/lib/navigation";

/**
 * Scroll Position Persistence for primary application panels.
 *
 * Design (approved architecture):
 * - sessionStorage only (per-tab, cleared on tab close by the browser).
 * - Applies to top-level panels reached via primary navigation (sidebar /
 *   bottom nav) AND to supported detail routes reached via workflow links
 *   (see DETAIL_PREFIXES). Edit/new/settings leaf routes remain excluded.
 * - Keyed by the full route identity (pathname + canonical search params), so
 *   pagination states keep independent positions.
 * - Save: synchronously in markPrimaryNavigation() (onClick), before Next.js
 *   resets window.scrollY during its commit-phase scroll-to-top.
 * - Restore: only when an approved navigation trigger sets the one-shot flag;
 *   gated so server redirects (e.g. after mutations) and refresh do not restore.
 * - Highlight precedence: when the incoming URL carries a `highlight` param,
 *   restore is skipped for that navigation — the highlighted item is the
 *   authoritative viewport. Restore runs only on Back/Cancel/normal navigation.
 * - Restore uses ResizeObserver to wait for the document to reach its final
 *   height (Server Component content resolves after loading.tsx skeleton).
 * - Restore is clamped to the live document height to handle content that
 *   shrank (records removed) since the position was saved.
 * - Independent of useScrollPreservingRefresh (mutation `router.refresh()`).
 */

const STORAGE_PREFIX = "scroll:";
const NAV_FLAG = "navScrollRestore";
const SIDEBAR_STORAGE_PREFIX = "sidebarScroll:";
const SIDEBAR_RESTORE_PREFIX = "sidebarScrollRestore:";

type SidebarScope = "admin" | "teacher";

function activeSidebarScroller(link: HTMLElement): HTMLElement | null {
  const nav = link.closest<HTMLElement>("nav");
  const aside = nav?.closest<HTMLElement>("aside");

  for (const candidate of [nav, aside]) {
    if (!candidate || candidate.getClientRects().length === 0) continue;
    const { overflowY } = window.getComputedStyle(candidate);
    if (
      /(auto|scroll)/.test(overflowY) &&
      candidate.scrollHeight > candidate.clientHeight
    ) {
      return candidate;
    }
  }

  return null;
}

export function markSidebarNavigation(
  scope: SidebarScope,
  link: HTMLElement,
): void {
  try {
    const scroller = activeSidebarScroller(link);
    if (!scroller) return;
    sessionStorage.setItem(
      `${SIDEBAR_STORAGE_PREFIX}${scope}`,
      String(Math.round(scroller.scrollTop)),
    );
    sessionStorage.setItem(`${SIDEBAR_RESTORE_PREFIX}${scope}`, "1");
  } catch {
    // sessionStorage may be unavailable — navigation continues normally.
  }
}

export function restoreSidebarScroll(
  scope: SidebarScope,
  link: HTMLElement,
): void {
  try {
    const restoreKey = `${SIDEBAR_RESTORE_PREFIX}${scope}`;
    if (sessionStorage.getItem(restoreKey) !== "1") return;
    sessionStorage.removeItem(restoreKey);

    const saved = Number(
      sessionStorage.getItem(`${SIDEBAR_STORAGE_PREFIX}${scope}`),
    );
    const scroller = activeSidebarScroller(link);
    if (!Number.isFinite(saved) || !scroller) return;

    const maxScrollable = Math.max(
      0,
      scroller.scrollHeight - scroller.clientHeight,
    );
    scroller.scrollTop = Math.min(saved, maxScrollable);
  } catch {
    // sessionStorage may be unavailable — active-link reveal remains the fallback.
  }
}

// Whitelist = primary-nav panels (single source of truth) + teacher /reports
// (reached via the Dashboard quick-action, not the bottom nav).
const WHITELIST = new Set<string>([
  ...teacherNavigationItems.map((i) => i.href),
  ...adminNavigationItems.map((i) => i.href),
  "/reports",
]);

// Detail routes are dynamic (e.g. /students/[id]) so they can never match the
// literal WHITELIST above. The prefixes below opt supported detail screens into
// the same save/restore cycle as primary panels. The trailing slash ensures a
// prefix only matches nested detail paths (/students/abc) and never the list
// route itself (/students), which the WHITELIST already covers.
const DETAIL_PREFIXES = [
  "/students/",
  "/formative/",
  "/summative/",
  "/admin/students/",
];

function isRestorable(pathname: string): boolean {
  if (WHITELIST.has(pathname)) return true;
  return DETAIL_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function routeIdentity(pathname: string, queryString: string): string {
  const params = new URLSearchParams(queryString);
  params.sort();
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function storageKey(identity: string): string {
  return `${STORAGE_PREFIX}${identity}`;
}

function readSaved(identity: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(storageKey(identity));
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function usePanelScrollRestoration(): void {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const identity = routeIdentity(pathname, searchParams.toString());
  const hasHighlight = searchParams.get("highlight") !== null;
  const prevIdentity = useRef<string | null>(identity);

  useEffect(() => {
    const handlePaginationClick = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const currentUrl = new URL(window.location.href);
      const destinationUrl = new URL(anchor.href, currentUrl);
      if (
        destinationUrl.origin !== currentUrl.origin ||
        destinationUrl.pathname !== currentUrl.pathname
      ) {
        return;
      }

      const currentPage = currentUrl.searchParams.get("page") ?? "1";
      const destinationPage = destinationUrl.searchParams.get("page") ?? "1";
      if (currentPage === destinationPage) return;

      markPrimaryNavigation(currentUrl.pathname);

      try {
        const currentScrollY = String(Math.round(window.scrollY));

        // Pagination links may add a resolved query parameter that was absent
        // from the current URL (for example, a default programType). Save the
        // outgoing page under that normalized route identity as well, because
        // the reverse link will use the normalized URL.
        const normalizedCurrentUrl = new URL(destinationUrl);
        if (currentPage === "1") {
          normalizedCurrentUrl.searchParams.delete("page");
        } else {
          normalizedCurrentUrl.searchParams.set("page", currentPage);
        }
        const normalizedCurrentIdentity = routeIdentity(
          normalizedCurrentUrl.pathname,
          normalizedCurrentUrl.search,
        );
        sessionStorage.setItem(
          storageKey(normalizedCurrentIdentity),
          currentScrollY,
        );

        // A pagination URL has no saved position on its first visit. Seed it
        // with the outgoing viewport so the cold transition behaves like later
        // visits while still allowing each page to diverge independently.
        const destinationIdentity = routeIdentity(
          destinationUrl.pathname,
          destinationUrl.search,
        );
        const destinationKey = storageKey(destinationIdentity);
        if (sessionStorage.getItem(destinationKey) === null) {
          sessionStorage.setItem(destinationKey, currentScrollY);
        }
      } catch {
        // sessionStorage may be unavailable — navigation continues normally.
      }
    };

    document.addEventListener("click", handlePaginationClick, true);
    return () => document.removeEventListener("click", handlePaginationClick, true);
  }, []);

  useLayoutEffect(() => {
    // Save is performed synchronously in markPrimaryNavigation() (onClick),
    // before Next.js resets window.scrollY. Nothing to save here.

    // Restore the INCOMING panel's scroll — only via primary navigation.
    const viaPrimaryNav = sessionStorage.getItem(NAV_FLAG) === "1";
    if (viaPrimaryNav) {
      sessionStorage.removeItem(NAV_FLAG); // one-shot
    }

    // Highlight precedence: a `highlight` param means the highlighted item is
    // the authoritative viewport for this navigation (e.g. a Save that returns
    // to the edited row). NAV_FLAG was already consumed above so it cannot leak
    // to a later navigation; scroll restoration is skipped for this load only.
    if (viaPrimaryNav && hasHighlight) {
      prevIdentity.current = identity;
      return;
    }

    if (viaPrimaryNav && isRestorable(pathname)) {
      const target = readSaved(identity);
      if (target != null) {
        const docEl = document.documentElement;

        const maxScrollable = () =>
          Math.max(0, docEl.scrollHeight - docEl.clientHeight);

        const tryRestore = () => {
          const max = maxScrollable();
          const clamped = Math.min(target, max);
          window.scrollTo(0, clamped);
          return max >= target;
        };

        // Fast path: if the document is already tall enough (e.g. no loading.tsx,
        // or content streamed before this effect), restore immediately.
        if (tryRestore()) {
          prevIdentity.current = identity;
          return;
        }

        // Otherwise wait for the content to grow. The observer exists ONLY
        // while this restore is pending and disconnects the instant it succeeds
        // (or on the safety timeout). Exactly one successful restore per nav.
        let restored = false;

        const finish = () => {
          if (restored) return;
          restored = true;
          observer.disconnect();
          window.clearTimeout(safetyTimer);
        };

        const observer = new ResizeObserver(() => {
          if (restored) return;
          if (tryRestore()) {
            finish();
          }
        });
        observer.observe(docEl);

        // Safety: guarantee termination even if height never reaches target.
        const safetyTimer = window.setTimeout(() => {
          tryRestore();
          finish();
        }, 3000);

        prevIdentity.current = identity;
        return () => finish();
      }
    }

    prevIdentity.current = identity;
  }, [identity, pathname, hasHighlight]);
}

/** Mark a navigation that may restore an eligible top-level panel.
 *  Called from primary NavigationLinks and scoped workflow return links.
 *
 *  Saves the OUTGOING panel's scroll position SYNCHRONOUSLY here, in the
 *  click handler, BEFORE Next.js App Router resets window.scrollY to 0 during
 *  its commit-phase scroll-to-top. Saving in a post-navigation useEffect was
 *  too late (already 0); the click handler is the last reliable sync point. */
export function markPrimaryNavigation(
  outgoingPathname: string,
  queryString = typeof window === "undefined" ? "" : window.location.search,
): void {
  if (typeof window === "undefined") return;
  try {
    if (isRestorable(outgoingPathname)) {
      const identity = routeIdentity(
        outgoingPathname,
        queryString,
      );
      sessionStorage.setItem(
        storageKey(identity),
        String(Math.round(window.scrollY)),
      );
    }
    sessionStorage.setItem(NAV_FLAG, "1");
  } catch {
    // sessionStorage may be unavailable (private mode) — fail silently.
  }
}

/**
 * Arm scroll restoration for a navigation triggered by a server-action
 * redirect (which, unlike a WorkflowContextLink click, cannot call
 * markPrimaryNavigation itself). Sets only the one-shot NAV_FLAG so the
 * destination's restore effect runs against whatever scroll was saved on the
 * prior departure (e.g. the Detail → Edit departure). Does NOT save the
 * current page's scroll — the destination uses the previously saved value.
 *
 * Call from a client form's submit handler, immediately before invoking the
 * server action that will redirect back to a restorable route.
 */
export function markServerActionReturn(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(NAV_FLAG, "1");
  } catch {
    // sessionStorage may be unavailable (private mode) — fail silently.
  }
}
