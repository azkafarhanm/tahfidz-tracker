import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, ShieldCheck, UserCircle } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

type MobileUtilityBarProps = {
  currentPath: string;
  userName: string;
  isAdmin: boolean;
};

export default async function MobileUtilityBar({
  currentPath,
  userName,
  isAdmin,
}: MobileUtilityBarProps) {
  const locale = await getLocale();
  const [t, profileT, themeT] = await Promise.all([
    getTranslations("Sidebar"),
    getTranslations("Profile"),
    getTranslations("ThemeToggle"),
  ]);
  const RoleIcon = isAdmin ? ShieldCheck : BookOpen;
  const isProfile = currentPath === "/profile";

  return (
    <section className="mb-4 rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-lg shadow-slate-950/5 backdrop-blur sm:hidden dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link className="inline-flex items-center gap-3" href="/">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <RoleIcon aria-hidden="true" size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                {t("appName")}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {isAdmin ? t("roleAdmin") : t("roleTeacher")}
              </p>
            </div>
          </Link>
        </div>
        {isProfile ? (
          <div className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <UserCircle aria-hidden="true" size={17} strokeWidth={2.2} />
            <span className="max-w-24 truncate">{userName}</span>
          </div>
        ) : (
          <Link
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
            href="/profile"
          >
            <UserCircle aria-hidden="true" size={17} strokeWidth={2.2} />
            <span className="max-w-24 truncate">{userName}</span>
          </Link>
        )}
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/90">
        <LanguageSwitcher currentLocale={locale} />
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/90">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {profileT("themeLabel")}
          </p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            {profileT("themeDescription")}
          </p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <ThemeToggle
            labels={{
              auto: themeT("auto"),
              dark: themeT("dark"),
              light: themeT("light"),
              system: themeT("system"),
            }}
          />
        </div>
      </div>
    </section>
  );
}
