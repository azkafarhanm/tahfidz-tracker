"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

const HIGHLIGHT_PARAM = "highlight";
const ACTIVE_ATTR = "data-highlight-active";
const HIGHLIGHT_DURATION_MS = 2000;

export function useScrollToHighlightedItem() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const highlightId = searchParams.get(HIGHLIGHT_PARAM);
  const appliedRef = useRef<string | null>(null);
  const lockedScrollY = useRef<number | null>(null);
  const lockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (lockedScrollY.current === null) return;
    if (window.scrollY !== lockedScrollY.current) {
      window.scrollTo(0, lockedScrollY.current);
    }
  });

  useEffect(() => {
    if (!highlightId || appliedRef.current === highlightId) return;

    const el = document.querySelector(
      `[data-highlight="${CSS.escape(highlightId)}"]`,
    );
    if (!el) return;

    appliedRef.current = highlightId;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.setAttribute(ACTIVE_ATTR, "");

    requestAnimationFrame(() => {
      lockedScrollY.current = window.scrollY;
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete(HIGHLIGHT_PARAM);
    const query = params.toString();
    let observer: MutationObserver | null = null;

    const clearHighlightCleanup = () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
        lockTimeoutRef.current = null;
      }
      lockedScrollY.current = null;
      appliedRef.current = null;
      observer?.disconnect();
    };

    const cancelIfHighlightRemoved = () => {
      if (el.isConnected) return;
      clearHighlightCleanup();
    };

    observer = new MutationObserver(cancelIfHighlightRemoved);
    observer.observe(document.body, { childList: true, subtree: true });

    lockTimeoutRef.current = setTimeout(() => {
      lockTimeoutRef.current = null;
      observer?.disconnect();

      if (!el.isConnected) {
        lockedScrollY.current = null;
        appliedRef.current = null;
        return;
      }

      el.removeAttribute(ACTIVE_ATTR);
      lockedScrollY.current = null;
      appliedRef.current = null;

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }, HIGHLIGHT_DURATION_MS);

    return () => {
      clearHighlightCleanup();
    };
  }, [highlightId, searchParams, router, pathname]);
}
