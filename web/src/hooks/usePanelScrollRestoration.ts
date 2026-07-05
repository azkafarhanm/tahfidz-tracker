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
 * - Applies ONLY to top-level panels reached via primary navigation
 *   (sidebar / bottom nav). Detail, edit, and settings flows are excluded.
 * - Keyed by the full route identity (pathname + canonical search params), so
 *   pagination states keep independent positions.
 * - Save: synchronously in markPrimaryNavigation() (onClick), before Next.js
 *   resets window.scrollY during its commit-phase scroll-to-top.
 * - Restore: only when an approved navigation trigger sets the one-shot flag;
 *   gated so server redirects (e.g. after mutations) and refresh do not restore.
 * - Restore uses ResizeObserver to wait for the document to reach its final
 *   height (Server Component content resolves after loading.tsx skeleton).
 * - Restore is clamped to the live document height to handle content that
 *   shrank (records removed) since the position was saved.
 * - Independent of useScrollPreservingRefresh (mutation `router.refresh()`).
 */

const STORAGE_PREFIX = "scroll:";
const NAV_FLAG = "navScrollRestore";

// Whitelist = primary-nav panels (single source of truth) + teacher /reports
// (reached via the Dashboard quick-action, not the bottom nav).
const WHITELIST = new Set<string>([
  ...teacherNavigationItems.map((i) => i.href),
  ...adminNavigationItems.map((i) => i.href),
  "/reports",
]);

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

    if (viaPrimaryNav && WHITELIST.has(pathname)) {
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
  }, [identity, pathname]);
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
    if (WHITELIST.has(outgoingPathname)) {
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
