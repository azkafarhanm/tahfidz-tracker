"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useCallback, useState } from "react";
import {
  type NavigationItem,
  navigationIcons,
  isNavigationItemActive,
} from "@/lib/navigation";
import { markPrimaryNavigation } from "@/hooks/usePanelScrollRestoration";
import {
  markNavigationContext,
  readNavigationContext,
  mergeContextParams,
} from "@/hooks/useNavigationContext";

const SCROLL_KEY = "bottomNavScrollX";

function appendProgramType(href: string, programType: string | null): string {
  if (!programType) return href;
  if (href.includes("programType=")) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}programType=${programType}`;
}

function mergeVisibleSearchFormContext(queryString: string): string {
  const searchForm = document.querySelector<HTMLFormElement>(
    'form[role="search"]',
  );
  if (!searchForm) return queryString;

  const params = new URLSearchParams(queryString);
  for (const [key, value] of new FormData(searchForm)) {
    if (typeof value !== "string") continue;
    const normalizedValue = value.trim();
    if (normalizedValue) {
      params.set(key, normalizedValue);
    } else {
      params.delete(key);
    }
  }
  return params.toString();
}

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
  const searchParams = useSearchParams();
  const programType = searchParams.get("programType");
  const activeRef = useRef<HTMLAnchorElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const saveScroll = useCallback(() => {
    if (variant !== "bottom") return;
    const scroller = document.querySelector("[data-bottom-scroll]");
    if (scroller) {
      sessionStorage.setItem(SCROLL_KEY, String(scroller.scrollLeft));
    }
  }, [variant]);

  // Restore scroll position on mount and after navigation
  useEffect(() => {
    if (variant !== "bottom") return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      const scroller = document.querySelector("[data-bottom-scroll]");
      if (scroller) {
        scroller.scrollLeft = Number(saved);
      }
    }
  }, [pathname, variant]);

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
  }, [pathname, variant]);

  // Save scroll position before page unload
  useEffect(() => {
    if (variant !== "bottom") return;
    const handler = () => saveScroll();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [variant, saveScroll]);

  return items.map(({ key, href, iconKey }) => {
    const Icon = navigationIcons[iconKey];
    const active = isNavigationItemActive(pathname, href);
    const baseHref = appendProgramType(href, programType);
    const storedContext = mounted ? readNavigationContext(href) : null;
    const resolvedHref = mergeContextParams(baseHref, storedContext);

    if (variant === "bottom") {
      return (
        <Link
          ref={active ? activeRef : undefined}
          aria-current={active ? "page" : undefined}
          className={
            active
              ? "flex min-w-[84px] flex-col items-center gap-1 rounded-2xl bg-emerald-900 px-3 py-3 text-white shadow-sm dark:bg-emerald-950 dark:text-emerald-300"
              : "flex min-w-[84px] flex-col items-center gap-1 rounded-2xl px-3 py-3 text-slate-600 transition duration-100 active:bg-black/5 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:active:bg-white/10 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          }
          href={resolvedHref}
          key={key}
          onClick={() => {
            saveScroll();
            markPrimaryNavigation(pathname);
            markNavigationContext(
              pathname,
              mergeVisibleSearchFormContext(searchParams.toString()),
            );
          }}
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
            : "text-slate-600 active:bg-black/5 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:active:bg-white/10 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        }`}
        href={resolvedHref}
        key={key}
        onClick={() => {
          markPrimaryNavigation(pathname);
          markNavigationContext(
            pathname,
            mergeVisibleSearchFormContext(searchParams.toString()),
          );
        }}
      >
        <Icon aria-hidden="true" className="shrink-0" size={18} strokeWidth={active ? 2.3 : 2} />
        <span className="truncate">{labels[key] ?? key}</span>
      </Link>
    );
  });
}
