"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return items.map(({ key, href, iconKey }) => {
    const Icon = navigationIcons[iconKey];
    const active = isNavigationItemActive(pathname, href);

    if (variant === "bottom") {
      return (
        <Link
          aria-current={active ? "page" : undefined}
          className={
            active
              ? "flex min-w-[84px] flex-col items-center gap-1 rounded-2xl bg-emerald-900 px-3 py-3 text-white dark:bg-emerald-950 dark:text-emerald-400"
              : "flex min-w-[84px] flex-col items-center gap-1 rounded-2xl px-3 py-3 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          active
            ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-400"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        }`}
        href={href}
        key={key}
      >
        <Icon aria-hidden="true" size={18} strokeWidth={active ? 2.3 : 2} />
        {labels[key] ?? key}
      </Link>
    );
  });
}
