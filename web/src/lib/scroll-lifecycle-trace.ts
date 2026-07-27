"use client";

declare global {
  interface Window {
    __TAHFIDZ_SCROLL_TRACE_SEQUENCE__?: number;
  }
}

export function traceScrollLifecycle(
  event: string,
  details: Record<string, unknown> = {},
) {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") {
    return;
  }

  const sequence = (window.__TAHFIDZ_SCROLL_TRACE_SEQUENCE__ ?? 0) + 1;
  window.__TAHFIDZ_SCROLL_TRACE_SEQUENCE__ = sequence;
  console.info(
    `[ScrollLifecycleTrace #${String(sequence).padStart(3, "0")}] ${event}`,
    {
      at: new Date().toISOString(),
      pathname: window.location.pathname,
      search: window.location.search,
      scrollY: Math.round(window.scrollY),
      documentHeight: document.documentElement.scrollHeight,
      ...details,
    },
  );
}
