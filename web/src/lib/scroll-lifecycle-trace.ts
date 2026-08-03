"use client";

declare global {
  interface Window {
    __TAHFIDZ_SCROLL_TRACE_SEQUENCE__?: number;
    __TAHFIDZ_SCROLL_WRITER_SEQUENCE__?: number;
  }
}

type ScrollWriterDetails = {
  writer: string;
  reason: string;
  targetY?: number | null;
  targetX?: number | null;
  currentY?: number;
  target?: string;
};

/** Temporary instrumentation for finding the final scroll writer on physical
 *  devices. It deliberately logs in production until this audit concludes. */
export function traceScrollWriter({
  writer,
  reason,
  targetY = null,
  targetX = null,
  currentY = window.scrollY,
  target,
}: ScrollWriterDetails) {
  if (typeof window === "undefined") return;

  const sequence = (window.__TAHFIDZ_SCROLL_WRITER_SEQUENCE__ ?? 0) + 1;
  window.__TAHFIDZ_SCROLL_WRITER_SEQUENCE__ = sequence;
  console.info(`[ScrollWriter #${String(sequence).padStart(3, "0")}]`, {
    writer,
    reason,
    stack: new Error().stack,
    targetY,
    targetX,
    currentY: Math.round(currentY),
    target,
    time: new Date().toISOString(),
    pathname: window.location.pathname,
    search: window.location.search,
  });
}

/** Captures every window.scrollTo call, including framework-originated calls,
 *  while preserving its arguments and return value unchanged. */
export function installWindowScrollWriterTrace() {
  const nativeScrollTo = window.scrollTo;
  const tracedScrollTo = ((...args: Parameters<typeof window.scrollTo>) => {
    const firstArgument = args[0] as number | ScrollToOptions | undefined;
    const secondArgument = args[1] as number | undefined;
    const options = typeof firstArgument === "object" ? firstArgument : null;

    traceScrollWriter({
      writer: "window.scrollTo",
      reason: "direct invocation",
      targetY: typeof secondArgument === "number" ? secondArgument : options?.top ?? null,
      targetX: typeof firstArgument === "number" ? firstArgument : options?.left ?? null,
    });
    return nativeScrollTo.apply(window, args);
  }) as typeof window.scrollTo;

  window.scrollTo = tracedScrollTo;
  return () => {
    if (window.scrollTo === tracedScrollTo) {
      window.scrollTo = nativeScrollTo;
    }
  };
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
