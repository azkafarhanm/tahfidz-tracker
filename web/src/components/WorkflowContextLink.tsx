"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { markPrimaryNavigation } from "@/hooks/usePanelScrollRestoration";
import {
  markNavigationContext,
  mergeContextParams,
  mergeVisibleSearchFormContext,
  readNavigationContext,
} from "@/hooks/useNavigationContext";
import {
  applyContextParams,
  normalizeQuery,
  resolveScrollContext,
  samePageReturnQuery,
} from "@/lib/workflow-return";

type WorkflowContextLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  compatibilityKeys?: string[];
  contextParams?: Record<string, string | null | undefined>;
  href: string;
  preferStoredContext?: boolean;
  preserveCurrentScrollContext?: boolean;
  restoreContext?: boolean;
};

function compatibleContext(
  baseHref: string,
  storedContext: string | null,
  compatibilityKeys: string[],
): string | null {
  if (storedContext === null) return null;

  const [, baseQuery = ""] = baseHref.split("?", 2);
  const baseParams = new URLSearchParams(baseQuery);
  const storedParams = new URLSearchParams(storedContext);

  for (const key of compatibilityKeys) {
    if (
      baseParams.has(key) &&
      storedParams.has(key) &&
      baseParams.get(key) !== storedParams.get(key)
    ) {
      return null;
    }
  }

  return storedContext;
}

function isUnmodifiedPrimaryClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

function isSamePageScrollPreservingNavigation(
  href: string,
  pathname: string,
  scroll: ComponentProps<typeof Link>["scroll"],
) {
  if (scroll !== false || typeof window === "undefined") return false;

  const currentUrl = new URL(window.location.href);
  const destinationUrl = new URL(href, currentUrl.origin);

  return (
    destinationUrl.origin === currentUrl.origin &&
    destinationUrl.pathname === pathname &&
    destinationUrl.hash === currentUrl.hash
  );
}

export default function WorkflowContextLink({
  compatibilityKeys = [],
  contextParams,
  href,
  onClick,
  preferStoredContext = false,
  preserveCurrentScrollContext = false,
  restoreContext = false,
  scroll,
  target,
  ...props
}: WorkflowContextLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const destinationPathname = href.split("?", 1)[0];
  const storedContext = mounted && restoreContext
    ? compatibleContext(
        href,
        readNavigationContext(destinationPathname),
        compatibilityKeys,
      )
    : null;
  const resolvedHref = restoreContext && storedContext !== null && preferStoredContext
    ? `${destinationPathname}${storedContext ? `?${storedContext}` : ""}`
    : restoreContext
      ? mergeContextParams(href, storedContext)
      : href;

  useEffect(() => setMounted(true), []);

  return (
    <Link
      {...props}
      href={resolvedHref}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          target === "_blank" ||
          !isUnmodifiedPrimaryClick(event)
        ) {
          return;
        }

        const isSamePageQueryNavigation =
          isSamePageScrollPreservingNavigation(resolvedHref, pathname, scroll);
        // Some same-directory filters opt into preserving the exact source
        // context. Their destination overrides (for example grade=7 while
        // leaving grade=8) must not become a scroll-storage identity, or the
        // destination's saved position is overwritten before it renders.
        const currentContext = mergeVisibleSearchFormContext(
          searchParams.toString(),
        );
        const destinationContext = applyContextParams(
          currentContext,
          contextParams,
        );

        if (!isSamePageQueryNavigation) {
          markPrimaryNavigation(
            pathname,
            resolveScrollContext(
              currentContext,
              destinationContext,
              preserveCurrentScrollContext,
            ),
          );
        }
        const returnQuery = typeof window === "undefined"
          ? null
          : samePageReturnQuery(
              resolvedHref,
              window.location.href,
              window.location.origin,
              pathname,
            );
        if (
          !isSamePageQueryNavigation &&
          returnQuery !== null &&
          normalizeQuery(returnQuery) !== normalizeQuery(destinationContext)
        ) {
          markPrimaryNavigation(pathname, returnQuery);
        }
        markNavigationContext(
          pathname,
          destinationContext,
        );
      }}
      scroll={scroll}
      target={target}
    />
  );
}
