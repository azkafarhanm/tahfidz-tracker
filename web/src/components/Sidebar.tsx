"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import MotivationCard from "@/components/MotivationCard";

const teacherNav = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Santri", href: "/students", icon: Users },
  { label: "Catat Cepat", href: "/quick-log", icon: PlusCircle },
  { label: "Profil", href: "/profile", icon: UserCircle },
];

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: ShieldCheck },
  { label: "Guru", href: "/admin/teachers", icon: Users },
  { label: "Kelas", href: "/admin/classes", icon: GraduationCap },
  { label: "Halaqah", href: "/admin/halaqah", icon: BookOpen },
  { label: "Santri", href: "/admin/students", icon: UserRound },
  { label: "Laporan", href: "/admin/reports", icon: BarChart3 },
  { label: "Laporan Guru", href: "/reports", icon: ClipboardList },
];

export default function Sidebar({ userName, isAdmin }: { userName: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? adminNav : teacherNav;

  return (
    <aside className="hidden border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:fixed sm:inset-y-0 sm:left-0 sm:z-40 sm:flex sm:h-screen sm:w-64 sm:flex-col sm:overflow-hidden">
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
            <h1 className="text-lg font-bold text-slate-950 dark:text-white">TahfidzFlow</h1>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {isAdmin ? "Admin Dashboard" : "Guru Tahfidz"}
            </p>
          </div>
        </Link>
      </div>

      <nav className="shrink-0 p-3 space-y-1">
        {items.map(({ label, href, icon: Icon }) => {
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
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="mb-4">
          <MotivationCard />
        </div>
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
            {userName}
          </p>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
