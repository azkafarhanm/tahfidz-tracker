"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  ClipboardList,
  Home,
  PlusCircle,
  UserCircle,
  Users,
} from "lucide-react";

const teacherNavItems = [
  { key: "navHome", href: "/", icon: Home },
  { key: "navSantri", href: "/students", icon: Users },
  { key: "navCatat", href: "/quick-log", icon: PlusCircle },
  { key: "navSumatif", href: "/summative", icon: ClipboardList },
  { key: "navProfil", href: "/profile", icon: UserCircle },
] as const;

const adminNavItems = [
  { key: "navHome", href: "/", icon: Home },
  { key: "navGuru", href: "/admin/teachers", icon: Users },
  { key: "navSantri", href: "/admin/students", icon: ClipboardList },
  { key: "navLaporan", href: "/admin/reports", icon: BarChart3 },
  { key: "navProfil", href: "/profile", icon: UserCircle },
] as const;

export default function BottomNav({
  currentPath,
  isAdmin,
}: {
  currentPath: string;
  isAdmin: boolean;
}) {
  const t = useTranslations("BottomNav");
  const pathname = usePathname();
  const activePath = pathname || currentPath;
  const navItems = isAdmin ? adminNavItems : teacherNavItems;

  return (
    <nav className="sticky bottom-4 mt-6 grid grid-cols-5 rounded-3xl border border-slate-200 bg-white/95 p-2 text-center text-xs font-medium text-slate-500 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-400 sm:hidden">
      {navItems.map(({ key, href, icon: Icon }) => {
        const active =
          activePath === href || (href !== "/" && activePath.startsWith(href));
        return (
          <Link
            aria-current={active ? "page" : undefined}
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
