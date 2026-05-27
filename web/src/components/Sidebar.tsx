import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  BookOpen,
  UserCircle,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoutButton from "@/components/LogoutButton";
import NavigationLinks from "@/components/NavigationLinks";
import DesktopMotivationCard from "@/components/DesktopMotivationCard";
import { adminNavigationItems, teacherNavigationItems } from "@/lib/navigation";

export default async function Sidebar({
  userName,
  isAdmin,
}: {
  currentPath: string;
  userName: string;
  isAdmin: boolean;
}) {
  const locale = await getLocale();
  const [t, themeT, logoutT] = await Promise.all([
    getTranslations("Sidebar"),
    getTranslations("ThemeToggle"),
    getTranslations("LogoutButton"),
  ]);
  const navKeys = isAdmin ? adminNavigationItems : teacherNavigationItems;

  return (
    <aside className="hidden border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:fixed sm:inset-y-0 sm:left-0 rtl:sm:left-auto rtl:sm:right-0 sm:z-40 sm:flex sm:h-screen sm:w-64 sm:flex-col sm:overflow-hidden">
      <div className="shrink-0 p-5 border-b border-slate-100 dark:border-slate-800">
        <Link className="flex items-center gap-3" href="/">
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
        <NavigationLinks
          items={navKeys}
          labels={Object.fromEntries(navKeys.map(({ key }) => [key, t(key)]))}
          variant="sidebar"
        />
      </nav>

      <div className="flex-1" />

      <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="mb-3">
          <DesktopMotivationCard />
        </div>
        <div className="mb-3">
          <LanguageSwitcher currentLocale={locale} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
              {userName}
            </p>
            <ThemeToggle
              labels={{
                auto: themeT("auto"),
                dark: themeT("dark"),
                light: themeT("light"),
                system: themeT("system"),
              }}
            />
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
              label={logoutT("label")}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
