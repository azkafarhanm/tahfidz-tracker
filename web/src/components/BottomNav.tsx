"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, Users, PlusCircle, UserCircle } from "lucide-react";

const navItems = [
  { key: "navHome", href: "/", icon: Home },
  { key: "navSantri", href: "/students", icon: Users },
  { key: "navCatat", href: "/quick-log", icon: PlusCircle },
  { key: "navProfil", href: "/profile", icon: UserCircle },
] as const;

export default function BottomNav({ currentPath: _currentPath }: { currentPath: string }) {
  const t = useTranslations("BottomNav");
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-4 mt-6 grid grid-cols-4 rounded-3xl border border-slate-200 bg-white/95 p-2 text-center text-xs font-medium text-slate-500 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-400 sm:hidden">
      {navItems.map(({ key, href, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            className={
              active
                ? "flex flex-col items-center gap-1 rounded-2xl bg-emerald-900 px-2 py-3 text-white dark:bg-emerald-950 dark:text-emerald-400"
                : "flex flex-col items-center gap-1 rounded-2xl px-2 py-3 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            }
            href={href}
            key={key}
          >
            <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
