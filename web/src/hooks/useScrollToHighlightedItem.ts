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

    console.log("[highlight-debug] 1) effect start, scrollY:", window.scrollY);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.setAttribute(ACTIVE_ATTR, "");
    console.log("[highlight-debug] 2) scrollIntoView + setAttribute done, scrollY:", window.scrollY);

    const params = new URLSearchParams(searchParams.toString());
    params.delete(HIGHLIGHT_PARAM);
    const query = params.toString();

    setTimeout(() => {
      console.log("[highlight-debug] 3) router.replace about to fire, scrollY:", window.scrollY);
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
      console.log("[highlight-debug] 4) router.replace called, scrollY:", window.scrollY);
    }, 1000);

    setTimeout(() => {
      console.log("[highlight-debug] 5) BEFORE removeAttribute, scrollY:", window.scrollY);
      const beforeRect = el.getBoundingClientRect();
      console.log("[highlight-debug] 5a) element rect before remove:", { top: beforeRect.top, height: beforeRect.height });
      // TEMPORARILY DISABLED: el.removeAttribute(ACTIVE_ATTR);
      const afterRect = el.getBoundingClientRect();
      console.log("[highlight-debug] 5b) element rect after remove:", { top: afterRect.top, height: afterRect.height });
      console.log("[highlight-debug] 5c) AFTER removeAttribute, scrollY:", window.scrollY);
    }, HIGHLIGHT_DURATION_MS);

    const scrollMonitor = setInterval(() => {
      console.log("[highlight-debug] scrollY:", window.scrollY);
    }, 200);

    return () => clearInterval(scrollMonitor);
  }, [highlightId, searchParams, router, pathname]);
}
