"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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
 * - Keyed by pathname only (never query string / search params), so changing
 *   datasets (search / filter / pagination) naturally resets scroll.
 * - Save: synchronously in markPrimaryNavigation() (onClick), before Next.js
 *   resets window.scrollY during its commit-phase scroll-to-top.
 * - Restore: only when a "primary nav click" flag is set; gated so server
 *   redirects (e.g. after mutations) and browser refresh do not restore.
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

function storageKey(pathname: string): string {
  return `${STORAGE_PREFIX}${pathname}`;
}

function readSaved(pathname: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(storageKey(pathname));
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function usePanelScrollRestoration(): void {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(pathname);

  useLayoutEffect(() => {
    // Save is performed synchronously in markPrimaryNavigation() (onClick),
    // before Next.js resets window.scrollY. Nothing to save here.

    // Restore the INCOMING panel's scroll — only via primary navigation.
    const viaPrimaryNav = sessionStorage.getItem(NAV_FLAG) === "1";
    if (viaPrimaryNav) {
      sessionStorage.removeItem(NAV_FLAG); // one-shot
    }

    if (viaPrimaryNav && WHITELIST.has(pathname)) {
      const target = readSaved(pathname);
      if (target != null) {
        const docEl = document.documentElement;

        const maxScrollable = () =>
          Math.max(0, docEl.scrollHeight - docEl.clientHeight);

        const tryRestore = () => {
          const max = maxScrollable();
          if (max >= target) {
            const clamped = Math.min(target, max);
            window.scrollTo(0, clamped);
            return true;
          }
          return false;
        };

        // Fast path: if the document is already tall enough (e.g. no loading.tsx,
        // or content streamed before this effect), restore immediately.
        if (tryRestore()) {
          prevPathname.current = pathname;
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
        const safetyTimer = window.setTimeout(finish, 3000);

        prevPathname.current = pathname;
        return () => finish();
      }
    }

    prevPathname.current = pathname;
  }, [pathname]);
}

/** Mark the current navigation as originating from primary navigation.
 *  Called from NavigationLinks onClick on both sidebar and bottom variants.
 *
 *  Saves the OUTGOING panel's scroll position SYNCHRONOUSLY here, in the
 *  click handler, BEFORE Next.js App Router resets window.scrollY to 0 during
 *  its commit-phase scroll-to-top. Saving in a post-navigation useEffect was
 *  too late (already 0); the click handler is the last reliable sync point. */
export function markPrimaryNavigation(outgoingPathname: string): void {
  if (typeof window === "undefined") return;
  try {
    if (WHITELIST.has(outgoingPathname)) {
      sessionStorage.setItem(
        storageKey(outgoingPathname),
        String(Math.round(window.scrollY)),
      );
    }
    sessionStorage.setItem(NAV_FLAG, "1");
  } catch {
    // sessionStorage may be unavailable (private mode) — fail silently.
  }
}
