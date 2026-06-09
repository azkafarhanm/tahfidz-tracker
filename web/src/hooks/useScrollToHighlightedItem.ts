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

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.setAttribute(ACTIVE_ATTR, "");

    console.log("[highlight-debug] scrollIntoView fired, scrollY:", window.scrollY);

    const params = new URLSearchParams(searchParams.toString());
    params.delete(HIGHLIGHT_PARAM);
    const query = params.toString();

    setTimeout(() => {
      console.log("[highlight-debug] router.replace about to fire, scrollY before:", window.scrollY);
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
      console.log("[highlight-debug] router.replace called, scrollY after:", window.scrollY);
    }, 1000);

    setTimeout(() => {
      el.removeAttribute(ACTIVE_ATTR);
    }, HIGHLIGHT_DURATION_MS);
  }, [highlightId, searchParams, router, pathname]);
}
