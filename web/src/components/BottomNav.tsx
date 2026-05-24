"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { adminNavigationItems, teacherNavigationItems } from "@/lib/navigation";

export default function BottomNav({
  currentPath,
  isAdmin,
}: {
  currentPath: string;
  isAdmin: boolean;
}) {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const activePath = pathname || currentPath;
  const navItems = isAdmin ? adminNavigationItems : teacherNavigationItems;

  return (
    <nav className="sticky bottom-4 mt-6 sm:hidden">
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex min-w-max gap-2">
      {navItems.map(({ key, href, icon: Icon }) => {
        const active =
          activePath === href ||
          (href !== "/" && href !== "/admin" && activePath.startsWith(href));
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
            {t(key)}
          </Link>
        );
      })}
        </div>
      </div>
    </nav>
  );
}
