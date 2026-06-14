import {
  BarChart3,
  BookOpen,
  BookText,
  Clock,
  PenLine,
  RotateCcw,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getDashboardData } from "@/lib/dashboard";
import AppShell from "@/components/AppShell";
import LogoutButton from "@/components/LogoutButton";
import { requireSessionScope } from "@/lib/session";
import MotivationCard from "@/components/MotivationCard";
import InitialsAvatar from "@/components/InitialsAvatar";
import { getLocaleTag } from "@/lib/format";
import { badge, heroSummary } from "@/lib/colors";

export const runtime = "nodejs";

export async function generateMetadata() {
  const t = await getTranslations("Sidebar");
  return { title: `${t("navDashboard")} - TahfidzFlow` };
}

export default async function DashboardPreview() {
  const locale = await getLocale();
  const [t, logoutT] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("LogoutButton"),
  ]);
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const dashboard = await getDashboardData(teacherId, locale);
  const userName = session?.user?.name ?? t("defaultUserName");
  const quickActions = [
    { label: t("quickActionHafalan"), href: "/students", icon: BookOpen },
    { label: t("quickActionMurojaah"), href: "/students", icon: RotateCcw },
    { label: t("quickActionQuickLog"), href: "/quick-log", icon: PenLine },
    { label: t("quickActionFormative"), href: "/formative", icon: BookText },
    { label: t("quickActionSummative"), href: "/summative", icon: ClipboardList },
    ...(isAdmin
      ? [{ label: t("quickActionAdmin"), href: "/admin", icon: ShieldCheck }]
      : []),
    { label: t("quickActionLaporan"), href: isAdmin ? "/admin/reports" : "/reports", icon: BarChart3 },
  ];

  return (
    <AppShell currentPath="/" userName={userName} isAdmin={isAdmin}>
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {t("greeting")}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
              {userName}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {new Intl.DateTimeFormat(getLocaleTag(locale), {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LogoutButton label={logoutT("label")} />
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-lg font-semibold text-white shadow-lg shadow-emerald-900/20">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <MotivationCard />

        <section className={`mt-5 rounded-[1.75rem] p-5 sm:p-6 ${heroSummary}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">{t("summaryTodayLabel")}</p>
              <p className="mt-3 text-4xl font-semibold">
                {dashboard.todayRecordCount}
              </p>
              <p className="mt-1 text-sm text-slate-300">{t("summaryTodaySubtext")}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">{t("weeklyActivityLabel")}</p>
              <p className="mt-1 text-xl font-semibold">
                {dashboard.weeklyMemorizationCount + dashboard.weeklyRevisionCount}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-300">
            <span>{t("weeklyHafalanCount", { count: dashboard.weeklyMemorizationCount })}</span>
            <span className="text-white/30">·</span>
            <span>{t("weeklyMurojaahCount", { count: dashboard.weeklyRevisionCount })}</span>
            <span className="text-white/30">·</span>
            <span>{t("weeklyTargetsCompleted", { count: dashboard.weeklyCompletedTargets })}</span>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none"
              href={action.href}
              key={action.label}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                <action.icon aria-hidden="true" size={18} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1 break-words">{action.label}</span>
            </Link>
          ))}
        </section>

        {dashboard.overdueTargets.length > 0 ? (
          <section className="mt-5">
            <div className="flex items-center justify-between">
               <h2 className="text-lg font-semibold">{t("overdueTargetsHeading")}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.error}`}>
                {dashboard.overdueTargets.length} {t("overdueDeadlineBadge")}
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {dashboard.overdueTargets.map((ot) => (
                <Link
                  className="block rounded-2xl border border-red-200 bg-white p-4 shadow-sm transition hover:border-red-300 hover:shadow-md dark:border-red-900 dark:bg-slate-900 dark:shadow-none"
                  href={`/students/${ot.studentId}`}
                  key={ot.id}
                >
                  <div className="flex items-start justify-between gap-3">
                     <div className="min-w-0">
                       <div className="flex items-center gap-3">
                          <InitialsAvatar name={ot.studentName} />
                         <p className="truncate font-semibold text-slate-950 dark:text-white">{ot.studentName}</p>
                       </div>
                       <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{ot.range}</p>
                     </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${badge.error}`}>
                       <Clock aria-hidden="true" size={13} strokeWidth={2.2} />
                       {t("overdueBadgeLewat")}
                     </span>
                  </div>
                   <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("overdueDeadlineLabel")} {ot.endDate}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 flex flex-1 flex-col">
          <div className="flex items-center justify-between">
             <h2 className="text-lg font-semibold">{t("recentActivityHeading")}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.warning}`}>
               {dashboard.needsReviewCount} {t("needsReviewBadge")}
             </span>
          </div>

          <div className="mt-3 space-y-3">
            {dashboard.recentRecords.length > 0 ? (
              dashboard.recentRecords.map((record) => (
                <article
                   className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
                  key={record.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                       <p className="font-semibold text-slate-950 dark:text-white">
                         {record.student}
                       </p>
                       <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                         {record.type === "Hafalan" ? t("quickActionHafalan") : t("quickActionMurojaah")} - {record.range}
                       </p>
                    </div>
                     <div className="shrink-0 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                     <p>
                        {record.date}
                      </p>
                      <p className="mt-1">
                        {record.time}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                     <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.success}`}>
                       {record.status}
                     </span>
                    <Link
                       className="text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
                      href={`/students/${record.studentId}`}
                    >
                       {t("detailLink")}
                    </Link>
                  </div>
                </article>
              ))
            ) : (
               <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-400">
                 {t("emptyState")}
               </div>
            )}
          </div>
        </section>
    </AppShell>
  );
}
