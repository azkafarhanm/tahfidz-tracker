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
import { getLocale, getTranslations } from "next-intl/server";
import { getDashboardData } from "@/lib/dashboard";
import AppShell from "@/components/AppShell";
import LogoutButton from "@/components/LogoutButton";
import { requireSessionScope } from "@/lib/session";
import MotivationCard from "@/components/MotivationCard";
import InitialsAvatar from "@/components/InitialsAvatar";
import ActiveYearBadge from "@/components/ActiveYearBadge";
import ProgramSelector from "@/components/ProgramSelector";
import ProgramBadge from "@/components/ProgramBadge";
import { getLocaleTag, programTypeLabels } from "@/lib/format";
import { badge, heroSummary } from "@/lib/colors";
import { getActiveAcademicYear, getTeacherProgramContext } from "@/lib/academic-year";
import { ProgramType } from "@/generated/prisma-next/enums";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import ReleaseNotesModal from "@/components/ReleaseNotesModal";
import { getReleaseNotesForUser } from "@/lib/release-notes";

export const runtime = "nodejs";

export async function generateMetadata() {
  const t = await getTranslations("Sidebar");
  return { title: `${t("navDashboard")} - TahfidzFlow` };
}

export default async function DashboardPreview({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const [t, logoutT] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("LogoutButton"),
  ]);
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const params = await searchParams;
  const releaseNotes = await getReleaseNotesForUser(session.user.id);

  const requestedProgramType = params?.programType as ProgramType | undefined;
  const programContext = teacherId
    ? await getTeacherProgramContext(teacherId, await getActiveAcademicYear())
    : { programs: [ProgramType.ACADEMIC, ProgramType.BOARDING], hasMultiple: true, resolvedProgramType: undefined };
  const programType = isAdmin
    ? (requestedProgramType && ["ACADEMIC", "BOARDING"].includes(requestedProgramType) ? requestedProgramType : undefined)
    : (programContext.programs.includes(requestedProgramType as ProgramType)
      ? (requestedProgramType as ProgramType)
      : programContext.resolvedProgramType);

  const dashboard = await getDashboardData(teacherId, locale, programType);
  const userName = session?.user?.name ?? t("defaultUserName");
  const ptSuffix = programType ? `?programType=${programType}` : "";
  const dashboardReturnParams = new URLSearchParams();
  if (programType) dashboardReturnParams.set("programType", programType);
  if (typeof params?.dashboardShortcut === "string") {
    dashboardReturnParams.set("dashboardShortcut", params.dashboardShortcut);
  }
  const dashboardReturnTo = `/${dashboardReturnParams.toString() ? `?${dashboardReturnParams.toString()}` : ""}`;
  const shortcutHref = (href: string, shortcut: string) => {
    const [pathname, search = ""] = href.split("?", 2);
    const shortcutParams = new URLSearchParams(search);
    shortcutParams.set("dashboardShortcut", shortcut);
    return `${pathname}?${shortcutParams.toString()}`;
  };
  const quickActions = [
    { label: t("quickActionHafalan"), href: shortcutHref(`/students${ptSuffix}`, "hafalan"), icon: BookOpen },
    { label: t("quickActionMurojaah"), href: shortcutHref(`/students${ptSuffix}`, "murojaah"), icon: RotateCcw },
    { label: t("quickActionQuickLog"), href: shortcutHref(`/quick-log${ptSuffix}`, "quick-log"), icon: PenLine },
    { label: t("quickActionFormative"), href: shortcutHref(`/formative${ptSuffix}`, "formative"), icon: BookText },
    { label: t("quickActionSummative"), href: shortcutHref(`/summative${ptSuffix}`, "summative"), icon: ClipboardList },
    ...(isAdmin
      ? [{ label: t("quickActionAdmin"), href: shortcutHref("/admin", "admin"), icon: ShieldCheck }]
      : []),
    { label: t("quickActionLaporan"), href: shortcutHref(isAdmin ? "/admin/reports" : `/reports${ptSuffix}`, "reports"), icon: BarChart3 },
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
                timeZone: "Asia/Jakarta",
              }).format(new Date())}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <ActiveYearBadge />
              {programType && <ProgramBadge programType={programType} />}
              {isAdmin ? (
                <ProgramSelector
                  programs={["", "ACADEMIC", "BOARDING"]}
                  programTypeLabels={{ "": "Semua", ...programTypeLabels }}
                  currentProgramType={programType ?? ""}
                />
              ) : programContext.hasMultiple ? (
                <ProgramSelector
                  programs={programContext.programs}
                  programTypeLabels={programTypeLabels}
                  currentProgramType={programType ?? ProgramType.ACADEMIC}
                />
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LogoutButton label={logoutT("label")} />
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-lg font-semibold text-white shadow-lg shadow-emerald-900/20">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex justify-end">
          <ReleaseNotesModal
            latestPublished={releaseNotes.publishedHistory[0] ?? null}
            locale={locale}
            unreadPublished={isAdmin ? [] : releaseNotes.unreadPublished}
          />
        </div>

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

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
          {quickActions.map((action) => (
            <WorkflowContextLink
              className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none"
              href={action.href}
              key={action.label}
              restoreContext={!action.href.startsWith("/admin?")}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                <action.icon aria-hidden="true" size={18} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1 break-normal">{action.label}</span>
            </WorkflowContextLink>
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
                <WorkflowContextLink
                  className="block rounded-2xl border border-red-200 bg-white p-4 shadow-sm transition hover:border-red-300 hover:shadow-md dark:border-red-900 dark:bg-slate-900 dark:shadow-none"
                  href={`/students/${ot.studentId}?programType=${ot.programType}&returnTo=${encodeURIComponent(dashboardReturnTo)}`}
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
                </WorkflowContextLink>
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
                    <div className="min-w-0">
                       <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {record.student}
                        </p>
                        <ProgramBadge programType={record.programType} />
                       </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          {record.type === "Hafalan" ? t("quickActionHafalan") : record.type === "Tasmi'" ? t("quickActionTasmi") : t("quickActionMurojaah")} - {record.range}
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
                    <WorkflowContextLink
                       className="text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
                      href={`/students/${record.studentId}?programType=${record.programType}&returnTo=${encodeURIComponent(dashboardReturnTo)}`}
                    >
                       {t("detailLink")}
                    </WorkflowContextLink>
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
