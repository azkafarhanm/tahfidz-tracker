"use client";

import { useEffect } from "react";
import { usePanelScrollRestoration } from "@/hooks/usePanelScrollRestoration";
import { installWindowScrollWriterTrace } from "@/lib/scroll-lifecycle-trace";

/**
 * Mounted once in the root layout. Enables scroll-position persistence for
 * primary application panels. See usePanelScrollRestoration for details.
 */
export default function ScrollRestoration() {
  usePanelScrollRestoration();
  useEffect(() => installWindowScrollWriterTrace(), []);
  return null;
}
