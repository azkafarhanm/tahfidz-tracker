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

type WorkflowContextLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  compatibilityKeys?: string[];
  contextParams?: Record<string, string | null | undefined>;
  href: string;
  preferStoredContext?: boolean;
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

export default function WorkflowContextLink({
  compatibilityKeys = [],
  contextParams,
  href,
  onClick,
  preferStoredContext = false,
  restoreContext = false,
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

        const outgoingParams = new URLSearchParams(
          mergeVisibleSearchFormContext(searchParams.toString()),
        );
        for (const [key, value] of Object.entries(contextParams ?? {})) {
          if (value == null) {
            outgoingParams.delete(key);
          } else {
            outgoingParams.set(key, value);
          }
        }
        const outgoingContext = outgoingParams.toString();

        if (!restoreContext || storedContext !== null) {
          markPrimaryNavigation(pathname, outgoingContext);
        }
        markNavigationContext(
          pathname,
          outgoingContext,
        );
      }}
      target={target}
    />
  );
}
