"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { markPrimaryNavigation } from "@/hooks/usePanelScrollRestoration";
import { markNavigationContext } from "@/hooks/useNavigationContext";

type PanelScrollLinkProps = ComponentProps<typeof Link>;

export default function PanelScrollLink({
  onClick,
  target,
  ...props
}: PanelScrollLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Link
      {...props}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          target === "_blank" ||
          event.button !== 0 ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        ) {
          return;
        }
        markPrimaryNavigation(pathname, searchParams.toString());
        const contextParams = new URLSearchParams(searchParams.toString());
        contextParams.delete("dashboardShortcut");
        markNavigationContext(pathname, contextParams.toString());
      }}
      target={target}
    />
  );
}
