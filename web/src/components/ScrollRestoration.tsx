"use client";

import { usePanelScrollRestoration } from "@/hooks/usePanelScrollRestoration";

/**
 * Mounted once in the root layout. Enables scroll-position persistence for
 * primary application panels. See usePanelScrollRestoration for details.
 */
export default function ScrollRestoration() {
  usePanelScrollRestoration();
  return null;
}
