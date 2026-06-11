"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const HIGHLIGHT_PARAM = "highlight";
const ACTIVE_ATTR = "data-highlight-active";
const HIGHLIGHT_DURATION_MS = 2000;

export function useScrollToHighlightedItem() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

    const params = new URLSearchParams(searchParams.toString());
    params.delete(HIGHLIGHT_PARAM);
    const query = params.toString();
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

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }, HIGHLIGHT_DURATION_MS);

    return () => {
      clearTimeout(timeout);
      cleanup();
    };
  }, [highlightId, searchParams, router, pathname]);
}
