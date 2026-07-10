"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const HIGHLIGHT_PARAM = "highlight";
const HIGHLIGHTS_PARAM = "highlights";
const ACTIVE_ATTR = "data-highlight-active";
const HIGHLIGHT_DURATION_MS = 2000;

export function useScrollToHighlightedItem() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const highlightId = searchParams.get(HIGHLIGHT_PARAM) ?? "";
  const highlightIds = searchParams.get(HIGHLIGHTS_PARAM) ?? "";
  const highlightKey = `${highlightId}|${highlightIds}`;
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    const ids = new Set(
      [highlightId, ...highlightIds.split(",")].filter(Boolean),
    );
    if (ids.size === 0 || appliedRef.current === highlightKey) return;

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-highlight]"),
    ).filter((element) =>
      ids.has(element.getAttribute("data-highlight") ?? ""),
    );
    if (elements.length === 0) return;

    appliedRef.current = highlightKey;

    elements[0].scrollIntoView({ behavior: "instant", block: "center" });
    for (const element of elements) {
      element.setAttribute(ACTIVE_ATTR, "");
    }

    let observer: MutationObserver | null = null;

    const cleanup = () => {
      appliedRef.current = null;
      observer?.disconnect();
    };

    const cancelIfHighlightRemoved = () => {
      if (elements.some((element) => element.isConnected)) return;
      cleanup();
    };

    observer = new MutationObserver(cancelIfHighlightRemoved);
    observer.observe(document.body, { childList: true, subtree: true });

    const timeout = setTimeout(() => {
      observer?.disconnect();

      if (!elements.some((element) => element.isConnected)) {
        appliedRef.current = null;
        return;
      }

      for (const element of elements) {
        element.removeAttribute(ACTIVE_ATTR);
      }
      appliedRef.current = null;

      // Use history.replaceState to update URL without triggering React re-render
      // router.replace() would cause a re-render that resets scroll position
      const params = new URLSearchParams(searchParams.toString());
      params.delete(HIGHLIGHT_PARAM);
      params.delete(HIGHLIGHTS_PARAM);
      const query = params.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;
      window.history.replaceState(null, "", newUrl);
    }, HIGHLIGHT_DURATION_MS);

    return () => {
      clearTimeout(timeout);
      cleanup();
    };
  }, [highlightId, highlightIds, highlightKey, searchParams, pathname]);
}
