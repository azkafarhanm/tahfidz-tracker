"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  teacherNavigationItems,
  adminNavigationItems,
} from "@/lib/navigation";
import {
  traceScrollLifecycle,
  traceScrollWriter,
} from "@/lib/scroll-lifecycle-trace";
import {
  isSupportedDetailPanel,
  scrollRouteIdentity,
  shouldConsumeScrollRestoreFlag,
} from "@/lib/scroll-restoration-policy";

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
    const targetY = Math.min(saved, maxScrollable);
    traceScrollWriter({
      writer: "sidebar.scrollTop",
      reason: "restore sidebar navigation position",
      targetY,
      currentY: scroller.scrollTop,
      target: "sidebar",
    });
    scroller.scrollTop = targetY;
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
function isRestorable(pathname: string): boolean {
  if (WHITELIST.has(pathname)) return true;
  return isSupportedDetailPanel(pathname);
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

function saveScroll(identity: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    storageKey(identity),
    String(Math.round(window.scrollY)),
  );
}

export function usePanelScrollRestoration(): void {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const identity = scrollRouteIdentity(pathname, searchParams.toString());
  const hasHighlight = searchParams.get("highlight") !== null;
  const prevIdentity = useRef<string | null>(identity);
  const currentIdentity = useRef(identity);
  const currentPathname = useRef(pathname);

  currentIdentity.current = identity;
  currentPathname.current = pathname;

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;

    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    traceScrollWriter({
      writer: "history.scrollRestoration",
      reason: "disable browser-native restoration",
      target: "manual",
    });
    traceScrollLifecycle("Browser Scroll Restoration initialized", {
      previous,
      current: window.history.scrollRestoration,
    });

    return () => {
      window.history.scrollRestoration = previous;
      traceScrollWriter({
        writer: "history.scrollRestoration",
        reason: "restore browser-native restoration setting",
        target: previous,
      });
      traceScrollLifecycle("Browser Scroll Restoration cleanup", {
        restoredValue: previous,
      });
    };
  }, []);

  useEffect(() => {
    const saveCurrentRoute = () => {
      try {
        if (isRestorable(currentPathname.current)) {
          saveScroll(currentIdentity.current);
        }
      } catch {
        // sessionStorage may be unavailable - native navigation continues.
      }
    };

    const handlePopState = () => {
      try {
        traceScrollLifecycle("Browser popstate received", {
          currentIdentity: currentIdentity.current,
          currentPathname: currentPathname.current,
          flagBefore: sessionStorage.getItem(NAV_FLAG),
        });
        saveCurrentRoute();
        sessionStorage.setItem(NAV_FLAG, "1");
        traceScrollLifecycle("Browser popstate armed scroll restore", {
          currentIdentity: currentIdentity.current,
          flagAfter: sessionStorage.getItem(NAV_FLAG),
        });
      } catch {
        // sessionStorage may be unavailable - browser history continues.
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pagehide", saveCurrentRoute);
    traceScrollLifecycle("Scroll persistence listeners mounted", {
      identity: currentIdentity.current,
    });
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pagehide", saveCurrentRoute);
    };
  }, []);

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
        const normalizedCurrentIdentity = scrollRouteIdentity(
          normalizedCurrentUrl.pathname,
          normalizedCurrentUrl.search,
        );
        sessionStorage.setItem(
          storageKey(normalizedCurrentIdentity),
          currentScrollY,
        );

        // A pagination destination is restored only after that exact page has
        // saved its own position. Reusing the outgoing page's viewport here
        // makes a first visit look like a late downward scroll restore.
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
    const rawNavigationFlag = sessionStorage.getItem(NAV_FLAG);
    const viaPrimaryNav = rawNavigationFlag === "1";
    const incomingRouteIsRestorable = isRestorable(pathname);
    const consumesRestoreFlag = shouldConsumeScrollRestoreFlag(
      viaPrimaryNav,
      incomingRouteIsRestorable,
    );
    traceScrollLifecycle("Scroll restore layout effect started", {
      identity,
      viaPrimaryNav,
      rawNavigationFlag,
      restorable: incomingRouteIsRestorable,
      consumesRestoreFlag,
      hasHighlight,
      savedTarget: readSaved(identity),
    });
    if (consumesRestoreFlag) {
      sessionStorage.removeItem(NAV_FLAG); // one-shot
      traceScrollLifecycle("Scroll restore flag consumed", {
        identity,
        restorable: incomingRouteIsRestorable,
      });
    }

    // Highlight precedence: a `highlight` param means the highlighted item is
    // the authoritative viewport for this navigation (e.g. a Save that returns
    // to the edited row). NAV_FLAG was already consumed above so it cannot leak
    // to a later navigation; scroll restoration is skipped for this load only.
    if (consumesRestoreFlag && hasHighlight) {
      prevIdentity.current = identity;
      return;
    }

    if (consumesRestoreFlag) {
      const target = readSaved(identity);
      if (target != null) {
        const docEl = document.documentElement;

        const maxScrollable = () =>
          Math.max(0, docEl.scrollHeight - docEl.clientHeight);

        const tryRestore = () => {
          const max = maxScrollable();
          const clamped = Math.min(target, max);
          traceScrollLifecycle("Scroll restore attempt", {
            identity,
            target,
            maxScrollable: max,
            clamped,
          });
          window.scrollTo(0, clamped);
          const complete = max >= target;
          traceScrollLifecycle(
            complete ? "Final scroll restore" : "Scroll context partially restored",
            {
              identity,
              target,
              applied: clamped,
              complete,
            },
          );
          return complete;
        };

        // Once restore succeeds, install a short-lived watchdog that re-asserts
        // the target if Next.js App Router issues a late scroll-to-top after the
        // streamed Server Component content commits. The watchdog:
        //  - arms only within a brief window right after a successful restore;
        //  - disarms the instant the user scrolls themselves (so we never fight
        //    genuine user input);
        //  - re-applies `scrollTo(0, target)` only when scrollY was driven to a
        //    position other than the target by a non-user writer.
        const WATCHDOG_MS = 600;
        const armWatchdog = () => {
          let disarmed = false;
          let userInteracted = false;
          const disarm = () => {
            if (disarmed) return;
            disarmed = true;
            window.removeEventListener("scroll", onWatchdogScroll, true);
            window.removeEventListener("wheel", onUserInput, true);
            window.removeEventListener("pointerdown", onUserInput, true);
            window.removeEventListener("touchstart", onUserInput, true);
            window.removeEventListener("touchmove", onUserInput, true);
            window.removeEventListener("keydown", onUserInput, true);
            window.clearTimeout(watchdogTimer);
            timers.forEach((timer) => window.clearTimeout(timer));
          };
          const onUserInput = () => {
            userInteracted = true;
            disarm();
          };
          const onWatchdogScroll = () => {
            if (userInteracted && window.scrollY !== target) {
              disarm();
            }
          };
          // Re-assert on the next macrotasks; App Router's scroll-to-top lands
          // asynchronously after streamed content commits. On cold routes it can
          // also land at a non-zero anchored position, so any non-user drift is
          // corrected within the watchdog window.
          const reassert = () => {
            if (disarmed) return;
            if (!userInteracted && window.scrollY !== target) {
              window.scrollTo(0, target);
            }
          };
          // Schedule a few reassertion passes within the watchdog window.
          const passes = [0, 60, 160, 320];
          const timers: number[] = passes.map((d) =>
            window.setTimeout(reassert, d),
          );
          const watchdogTimer = window.setTimeout(() => {
            disarm();
          }, WATCHDOG_MS);
          window.addEventListener("scroll", onWatchdogScroll, true);
          window.addEventListener("wheel", onUserInput, true);
          // Pointer-down covers scrollbar drags and middle-click autoscroll;
          // touchstart claims ownership before the first mobile scroll frame.
          window.addEventListener("pointerdown", onUserInput, true);
          window.addEventListener("touchstart", onUserInput, true);
          window.addEventListener("touchmove", onUserInput, true);
          window.addEventListener("keydown", onUserInput, true);
          return disarm;
        };

        // Fast path: if the document is already tall enough (e.g. no loading.tsx,
        // or content streamed before this effect), restore immediately.
        if (tryRestore()) {
          const disarm = armWatchdog();
          prevIdentity.current = identity;
          return disarm;
        }

        // Otherwise wait for the content to grow. The observer exists ONLY
        // while this restore is pending and disconnects the instant it succeeds
        // (or on the safety timeout). User input also hands viewport ownership
        // over permanently, so no later ResizeObserver callback can restore.
        let restored = false;
        let watchdogDisarm: (() => void) | undefined;

        const onUserInput = () => {
          traceScrollWriter({
            writer: "panel-resize-observer",
            reason: "user took scroll ownership; cancel pending restore",
            targetY: target,
          });
          finish();
        };

        const removeUserInputListeners = () => {
          window.removeEventListener("wheel", onUserInput, true);
          window.removeEventListener("pointerdown", onUserInput, true);
          window.removeEventListener("touchstart", onUserInput, true);
          window.removeEventListener("touchmove", onUserInput, true);
          window.removeEventListener("keydown", onUserInput, true);
        };

        const finish = () => {
          if (restored) return;
          restored = true;
          observer.disconnect();
          window.clearTimeout(safetyTimer);
          removeUserInputListeners();
        };

        const observer = new ResizeObserver(() => {
          if (restored) return;
          if (tryRestore()) {
            watchdogDisarm = armWatchdog();
            finish();
          }
        });
        observer.observe(docEl);

        // Safety: guarantee termination even if height never reaches target.
        const safetyTimer = window.setTimeout(() => {
          if (restored) return;
          tryRestore();
          finish();
        }, 3000);

        window.addEventListener("wheel", onUserInput, true);
        window.addEventListener("pointerdown", onUserInput, true);
        window.addEventListener("touchstart", onUserInput, true);
        window.addEventListener("touchmove", onUserInput, true);
        window.addEventListener("keydown", onUserInput, true);

        prevIdentity.current = identity;
        return () => {
          watchdogDisarm?.();
          finish();
        };
      }
      traceScrollLifecycle("Scroll restore skipped: no saved target", {
        identity,
      });
    } else {
      traceScrollLifecycle("Scroll restore skipped: navigation not eligible", {
        identity,
        viaPrimaryNav,
        restorable: incomingRouteIsRestorable,
      });
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
      const identities = new Set([
        scrollRouteIdentity(outgoingPathname, window.location.search),
        scrollRouteIdentity(outgoingPathname, queryString),
      ]);
      for (const identity of identities) {
        saveScroll(identity);
      }
      traceScrollLifecycle("Scroll Context saved", {
        outgoingPathname,
        identities: [...identities],
        savedScrollY: Math.round(window.scrollY),
      });
    }
    sessionStorage.setItem(NAV_FLAG, "1");
    traceScrollLifecycle("Scroll restore armed", {
      outgoingPathname,
      queryString,
      flag: sessionStorage.getItem(NAV_FLAG),
    });
  } catch {
    // sessionStorage may be unavailable (private mode) — fail silently.
  }
}

/**
 * Arm scroll restoration for a navigation triggered by a server-action
 * redirect (which, unlike a WorkflowContextLink click, cannot call
 * markPrimaryNavigation itself). Sets only the one-shot NAV_FLAG so the
 * destination's restore effect runs against whatever scroll was saved on the
 * prior departure (e.g. the Detail -> Edit departure). Does NOT save the
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
