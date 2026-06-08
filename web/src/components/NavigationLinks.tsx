"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  type NavigationItem,
  navigationIcons,
  isNavigationItemActive,
} from "@/lib/navigation";

type NavigationLinksProps = {
  items: readonly NavigationItem[];
  labels: Record<string, string>;
  variant: "sidebar" | "bottom";
};

export default function NavigationLinks({
  items,
  labels,
  variant,
}: NavigationLinksProps) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = activeRef.current;
    if (!el) return;

    if (variant === "sidebar") {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });

      const nav = el.closest("nav");
      if (!nav) return;

      const observer = new ResizeObserver(() => {
        el.scrollIntoView({ block: "nearest" });
      });
      observer.observe(nav);
      return () => observer.disconnect();
    }

    const scroller = el.closest("[data-bottom-scroll]");
    if (!scroller) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const overflowLeft = elRect.left - scrollerRect.left;
    const overflowRight = elRect.right - scrollerRect.right;
    if (overflowLeft < 0) {
      scroller.scrollBy({ left: overflowLeft - 12, behavior: "smooth" });
    } else if (overflowRight > 0) {
      scroller.scrollBy({ left: overflowRight + 12, behavior: "smooth" });
    }
  }, [pathname, variant]);

  return items.map(({ key, href, iconKey }) => {
    const Icon = navigationIcons[iconKey];
    const active = isNavigationItemActive(pathname, href);

    if (variant === "bottom") {
      return (
        <Link
          ref={active ? activeRef : undefined}
          aria-current={active ? "page" : undefined}
          className={
            active
              ? "flex min-w-[84px] flex-col items-center gap-1 rounded-2xl bg-emerald-900 px-3 py-3 text-white shadow-sm dark:bg-emerald-950 dark:text-emerald-300"
              : "flex min-w-[84px] flex-col items-center gap-1 rounded-2xl px-3 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          }
          href={href}
          key={key}
        >
          <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
          <span className="text-[11px] font-medium leading-tight">
            {labels[key] ?? key}
          </span>
        </Link>
      );
    }

    return (
      <Link
        ref={active ? activeRef : undefined}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
          active
            ? "bg-emerald-50 text-emerald-950 shadow-sm ring-1 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        }`}
        href={href}
        key={key}
      >
        <Icon aria-hidden="true" className="shrink-0" size={18} strokeWidth={active ? 2.3 : 2} />
        <span className="truncate">{labels[key] ?? key}</span>
      </Link>
    );
  });
}
