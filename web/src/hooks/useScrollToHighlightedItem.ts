"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const HIGHLIGHT_PARAM = "highlight";
const ACTIVE_ATTR = "data-highlight-active";
const HIGHLIGHT_DURATION_MS = 2000;

export function useScrollToHighlightedItem() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const highlightId = searchParams.get(HIGHLIGHT_PARAM);
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!highlightId || appliedRef.current === highlightId) return;

    const el = document.querySelector(
      `[data-highlight="${CSS.escape(highlightId)}"]`,
    );
    if (!el) return;

    appliedRef.current = highlightId;

    el.scrollIntoView({ behavior: "instant", block: "center" });
    el.setAttribute(ACTIVE_ATTR, "");

    let observer: MutationObserver | null = null;

    const cleanup = () => {
      appliedRef.current = null;
      observer?.disconnect();
    };

    const cancelIfHighlightRemoved = () => {
      if (el.isConnected) return;
      cleanup();
    };

    observer = new MutationObserver(cancelIfHighlightRemoved);
    observer.observe(document.body, { childList: true, subtree: true });

    const timeout = setTimeout(() => {
      observer?.disconnect();

      if (!el.isConnected) {
        appliedRef.current = null;
        return;
      }

      el.removeAttribute(ACTIVE_ATTR);
      appliedRef.current = null;

      // Use history.replaceState to update URL without triggering React re-render
      // router.replace() would cause a re-render that resets scroll position
      const params = new URLSearchParams(searchParams.toString());
      params.delete(HIGHLIGHT_PARAM);
      const query = params.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;
      window.history.replaceState(null, "", newUrl);
    }, HIGHLIGHT_DURATION_MS);

    return () => {
      clearTimeout(timeout);
      cleanup();
    };
  }, [highlightId, searchParams, pathname]);
}
