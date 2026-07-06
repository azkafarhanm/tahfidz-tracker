"use client";

import { useEffect, useRef } from "react";

/**
 * Horizontal-only scroll persistence for Formative tables.
 *
 * Persists ONLY horizontal (scrollLeft), never vertical.
 * - Scoped to a single per-table storage key (passed via `storageKey`).
 * - Independent of the panel/vertical scroll restoration, Navigation Context,
 *   and WorkflowContextLink — those are untouched.
 *
 * Save strategy:
 *   The live scrollLeft is written to sessionStorage from the scroll event
 *   handler, WHILE the element is still connected to the document. Saving in a
 *   useEffect cleanup was rejected because React runs that cleanup AFTER the
 *   node is detached, at which point the browser has reset scrollLeft to 0
 *   (the same trap that usePanelScrollRestoration's author documented and
 *   avoided by saving synchronously in the click handler).
 *
 * Restore strategy:
 *   On mount, apply the saved scrollLeft. Server Component content (and the
 *   loading.tsx skeleton) means the table may not be wide enough at first
 *   paint, so a ResizeObserver retries until the target is reachable (bounded
 *   by a 3s safety timeout) — the same philosophy as the vertical restore.
 *
 * sessionStorage failures (private mode) are silent and non-fatal.
 */

type FormativeTableScrollProps = {
  /** Distinct sessionStorage key for this table's horizontal position. */
  storageKey: string;
  /** Optional className to merge onto the scroll container. */
  className?: string;
  children: React.ReactNode;
};

export default function FormativeTableScroll({
  storageKey,
  className = "overflow-x-auto",
  children,
}: FormativeTableScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Restore on mount: apply saved scrollLeft once content is laid out.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let saved: number | null = null;
    try {
      const raw = sessionStorage.getItem(storageKey);
      const n = raw == null ? NaN : Number(raw);
      saved = Number.isFinite(n) ? n : null;
    } catch {
      saved = null;
    }
    if (saved == null || saved === 0) return;

    const apply = () => {
      // Clamp to the live scrollable range so a target that exceeds the current
      // max (content shorter than when saved) still restores to the end rather
      // than being rejected entirely.
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      el.scrollLeft = Math.min(saved!, max);
      return max >= saved!;
    };

    // Fast path: table already wide enough at mount (e.g. content present
    // synchronously, no loading.tsx skeleton).
    if (apply()) return;

    // Otherwise wait for the streamed/laid-out content to widen the container
    // past the saved target, then restore. Same philosophy as
    // usePanelScrollRestoration's vertical restore: a ResizeObserver that keeps
    // retrying until the position is reachable, terminating the instant it
    // succeeds (or on a bounded safety timeout). Exactly one successful
    // restore per mount.
    let restored = false;

    const finish = () => {
      if (restored) return;
      restored = true;
      observer.disconnect();
      window.clearTimeout(safetyTimer);
    };

    const observer = new ResizeObserver(() => {
      if (restored) return;
      if (apply()) {
        finish();
      }
    });
    observer.observe(el);

    // Safety: guarantee termination and a final clamp attempt even if the
    // width never reaches the saved target (e.g. fewer columns than before).
    const safetyTimer = window.setTimeout(() => {
      tryRestore();
      finish();
    }, 3000);

    function tryRestore() {
      if (restored) return;
      apply();
    }

    return () => finish();
  }, [storageKey]);

  // Save on scroll: persist the LIVE scrollLeft while the element is still
  // connected. This is the only persistence write — it captures the value the
  // user actually sees, before any navigation detaches the node (which would
  // reset scrollLeft to 0). Debounced via rAF to avoid a sessionStorage write
  // on every intermediate scroll tick.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let pending = false;
    const flush = () => {
      pending = false;
      try {
        sessionStorage.setItem(storageKey, String(Math.round(el.scrollLeft)));
      } catch {
        // sessionStorage unavailable — ignore.
      }
    };
    const onScroll = () => {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(flush);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, [storageKey]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
