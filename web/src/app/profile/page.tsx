import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  MailCheck,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import AppShell from "@/components/AppShell";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";

export async function generateMetadata() {
  const t = await getTranslations("Profile");
  return { title: `${t("heading")} - TahfidzFlow` };
}

type ProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const locale = await getLocale();
  const { session, isAdmin } = await requireSessionScope();
  await searchParams;
  const [t, themeT, logoutT] = await Promise.all([
    getTranslations("Profile"),
    getTranslations("ThemeToggle"),
    getTranslations("LogoutButton"),
  ]);
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  const roleDescription = isAdmin
    ? t("roleDescriptionAdmin")
    : t("roleDescriptionTeacher");
  const actionsDescription = isAdmin
    ? t("actionsDescriptionAdmin")
    : t("actionsDescriptionTeacher");
  const backHref = isAdmin ? "/admin" : "/";
  const studentsHref = isAdmin ? "/admin/students" : "/students";

  return (
    <AppShell currentPath="/profile" userName={session.user.name} isAdmin={isAdmin}>
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
              href={backHref}
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              {t("backLink")}
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {t("heading")}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("description")}
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <UserCircle aria-hidden="true" size={22} strokeWidth={2.2} />
          </div>
        </header>

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <p className="text-sm text-emerald-100">{t("activeAccountLabel")}</p>
          <h2 className="mt-3 text-3xl font-semibold">{session.user.name}</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-slate-100">
              <Mail aria-hidden="true" size={15} strokeWidth={2.2} />
              {currentUser?.email ?? session.user.email}
            </span>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 font-medium text-emerald-100">
              {isAdmin ? t("roleBadgeAdmin") : t("roleBadgeTeacher")}
            </span>
          </div>
        </section>

        <section
          className={`mt-5 grid gap-3 ${isAdmin ? "sm:grid-cols-2" : ""}`}
        >
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("accountRoleLabel")}</p>
            <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
              {isAdmin ? t("roleAdmin") : t("roleTeacher")}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{roleDescription}</p>
          </article>

          {isAdmin ? (
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("adminAccessLabel")}</p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {t("adminAccessAvailable")}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("adminAccessDescription")}
              </p>
            </article>
          ) : null}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("themeLabel")}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("themeDescription")}</p>
          <div className="mt-3">
            <ThemeToggle
              labels={{
                auto: themeT("auto"),
                dark: themeT("dark"),
                light: themeT("light"),
                system: themeT("system"),
              }}
            />
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <LanguageSwitcher currentLocale={locale} />
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              <ShieldCheck aria-hidden="true" size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">{t("accountActionsHeading")}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{actionsDescription}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {isAdmin ? (
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
                href="/admin"
              >
                 {t("openAdminPanelButton")}
              </Link>
            ) : null}
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
              href={studentsHref}
            >
               {t("viewStudentsButton")}
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
              href="/profile/change-email"
            >
              <MailCheck aria-hidden="true" size={15} strokeWidth={2.2} />
               {t("changeEmailButton")}
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
              href="/profile/change-password"
            >
              <KeyRound aria-hidden="true" size={15} strokeWidth={2.2} />
               {t("changePasswordButton")}
            </Link>
            <LogoutButton label={logoutT("label")} />
          </div>
        </section>

      </AppShell>
  );
}
