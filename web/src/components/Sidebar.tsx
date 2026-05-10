"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  Home,
  PlusCircle,
  UserCircle,
  Users,
  ShieldCheck,
  GraduationCap,
  ClipboardList,
  UserRound,
  BarChart3,
  LogOut,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoutButton from "@/components/LogoutButton";

const MotivationCard = dynamic(() => import("@/components/MotivationCard"));

const teacherNavKeys = [
  { key: "navDashboard", href: "/", icon: Home },
  { key: "navSantri", href: "/students", icon: Users },
  { key: "navCatatCepat", href: "/quick-log", icon: PlusCircle },
  { key: "navProfil", href: "/profile", icon: UserCircle },
] as const;

const adminNavKeys = [
  { key: "navDashboard", href: "/admin", icon: ShieldCheck },
  { key: "navGuru", href: "/admin/teachers", icon: Users },
  { key: "navKelas", href: "/admin/classes", icon: GraduationCap },
  { key: "navHalaqah", href: "/admin/halaqah", icon: BookOpen },
  { key: "navSantri", href: "/admin/students", icon: UserRound },
  { key: "navLaporan", href: "/admin/reports", icon: BarChart3 },
  { key: "navLaporanGuru", href: "/reports", icon: ClipboardList },
  { key: "navProfil", href: "/profile", icon: UserCircle },
] as const;

export default function Sidebar({ userName, isAdmin }: { userName: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");
  const navKeys = isAdmin ? adminNavKeys : teacherNavKeys;

  return (
    <aside className="hidden border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:fixed sm:inset-y-0 sm:left-0 rtl:sm:left-auto rtl:sm:right-0 sm:z-40 sm:flex sm:h-screen sm:w-64 sm:flex-col sm:overflow-hidden">
      <div className="shrink-0 p-5 border-b border-slate-100 dark:border-slate-800">
        <Link className="flex items-center gap-3" href={isAdmin ? "/admin" : "/"}>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            {isAdmin ? (
              <ShieldCheck aria-hidden="true" size={20} strokeWidth={2.2} />
            ) : (
              <BookOpen aria-hidden="true" size={20} strokeWidth={2.2} />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-950 dark:text-white">{t("appName")}</h1>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {isAdmin ? t("roleAdmin") : t("roleTeacher")}
            </p>
          </div>
        </Link>
      </div>

      <nav className="shrink-0 p-3 space-y-1">
        {navKeys.map(({ key, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={active ? 2.3 : 2} />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="mb-3">
          <Suspense fallback={<div className="h-32 rounded-2xl border border-slate-100 bg-slate-50 animate-pulse dark:border-slate-800 dark:bg-slate-800" />}>
            <MotivationCard />
          </Suspense>
        </div>
        <div className="mb-3">
          <LanguageSwitcher />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
              {userName}
            </p>
            <ThemeToggle />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
              href="/profile"
            >
              <UserCircle aria-hidden="true" size={16} strokeWidth={2.2} />
              {t("navProfil")}
            </Link>
            <LogoutButton
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 hover:text-red-800 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950"
              icon={<LogOut className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
