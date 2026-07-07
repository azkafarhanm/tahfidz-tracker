import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getAdminDashboardData } from "@/lib/admin";
import InitialsAvatar from "@/components/InitialsAvatar";
import { badge, statCard, statValue, statLabel, heroSummary } from "@/lib/colors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminDashboard");
  return { title: `${t("heading")} - TahfidzFlow` };
}

export default async function AdminDashboardPage() {
  const t = await getTranslations("AdminDashboard");
  const locale = await getLocale();
  const dashboard = await getAdminDashboardData(locale);

  const managementAreas = [
    {
      title: t("areaGuruTitle"),
      description: t("areaGuruDescription"),
      icon: ShieldCheck,
      href: "/admin/teachers",
      actionLabel: t("areaGuruAction"),
    },
    {
      title: t("areaKelasTitle"),
      description: t("areaKelasDescription"),
      icon: GraduationCap,
      href: "/admin/classes",
      actionLabel: t("areaKelasAction"),
    },
    {
      title: t("areaHalaqahTitle"),
      description: t("areaHalaqahDescription"),
      icon: Users,
      href: "/admin/halaqah",
      actionLabel: t("areaHalaqahAction"),
    },
    {
      title: t("areaSantriTitle"),
      description: t("areaSantriDescription"),
      icon: BookOpen,
      href: "/admin/students",
      actionLabel: t("areaSantriAction"),
    },
    {
      title: t("areaLaporanTitle"),
      description: t("areaLaporanDescription"),
      icon: ClipboardList,
      href: "/admin/reports",
      actionLabel: t("areaLaporanAction"),
    },
  ];

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">
            {t("heading")}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t("description")}
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
          <ShieldCheck aria-hidden="true" size={22} strokeWidth={2.2} />
        </div>
      </header>

        <section className={`mt-6 rounded-[1.75rem] p-5 sm:p-6 ${heroSummary}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">{t("activeUsersLabel")}</p>
              <p className="mt-3 text-4xl font-semibold">
                {dashboard.counts.activeTeacherCount + dashboard.counts.adminCount}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {t("activeUsersSubtext")}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">{t("totalRecordsLabel")}</p>
              <p className="mt-1 text-xl font-semibold">
                {dashboard.counts.totalRecordCount}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.success}`}>
            <p className={`text-xs font-medium ${statLabel.success}`}>{t("statActiveTeachers")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.success}`}>
              {dashboard.counts.activeTeacherCount}
            </p>
            <p className={`mt-1 text-xs ${statLabel.success}`}>
              {t("statTeachersSubtext", { count: dashboard.counts.teacherCount })}
            </p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.success}`}>
            <p className={`text-xs font-medium ${statLabel.success}`}>{t("statActiveStudents")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.success}`}>
              {dashboard.counts.activeStudentCount}
            </p>
            <p className={`mt-1 text-xs ${statLabel.success}`}>
              {t("statStudentsSubtext", { count: dashboard.counts.studentCount })}
            </p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.info}`}>
            <p className={`text-xs font-medium ${statLabel.info}`}>{t("statClasses")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.info}`}>
              {dashboard.counts.academicClassCount}
            </p>
            <p className={`mt-1 text-xs ${statLabel.info}`}>
              {t("statClassesSubtext")}
            </p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.progress}`}>
            <p className={`text-xs font-medium ${statLabel.progress}`}>{t("statHalaqah")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.progress}`}>
              {dashboard.counts.classGroupCount}
            </p>
            <p className={`mt-1 text-xs ${statLabel.progress}`}>
              {t("statHalaqahSubtext")}
            </p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.progress}`}>
            <p className={`text-xs font-medium ${statLabel.progress}`}>{t("statActiveTargets")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.progress}`}>
              {dashboard.counts.activeTargetCount}
            </p>
            <p className={`mt-1 text-xs ${statLabel.progress}`}>{t("statActiveTargetsSubtext")}</p>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("managementHeading")}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.success}`}>
                {t("phaseBadge")}
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {managementAreas.map((area) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
                  key={area.href}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                      <area.icon aria-hidden="true" size={18} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-normal font-semibold text-slate-950 dark:text-white">{area.title}</p>
                      <p className="mt-1 break-normal text-sm text-slate-600 dark:text-slate-400">
                        {area.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {area.href ? (
                      <Link
                        className="inline-flex items-center rounded-xl bg-emerald-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-950"
                        href={area.href}
                      >
                        {area.actionLabel}
                      </Link>
                    ) : (
                      <span className={`inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold ${badge.neutral}`}>
                        {area.actionLabel}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("recentTeachersHeading")}</h2>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.info}`}>
                  {dashboard.recentTeachers.length}
                </span>
                <Link
                  className="text-xs font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
                  href="/admin/teachers"
                >
                  {t("viewAllLink")}
                </Link>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {dashboard.recentTeachers.length > 0 ? (
                dashboard.recentTeachers.map((teacher) => (
                  <article
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
                    key={teacher.id}
                  >
                    <div className="flex items-center gap-3">
                       <InitialsAvatar name={teacher.fullName} />
                       <p className="font-semibold text-slate-950 dark:text-white">
                         {teacher.fullName}
                       </p>
                     </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{teacher.email}</p>
                     <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                       <span className={`rounded-full px-3 py-1 ${badge.info}`}>
                         {teacher.studentCount} {t("teacherStudentCount")}
                       </span>
                       <span className={`rounded-full px-3 py-1 ${badge.progress}`}>
                         {teacher.classGroupCount} {t("teacherHalaqahCount")}
                       </span>
                      <span
                        className={`rounded-full px-3 py-1 ${teacher.isActive ? badge.success : badge.warning}`}
                      >
                        {teacher.isActive ? t("badgeAktif") : t("badgeNonaktif")}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                  {t("emptyTeachers")}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              <ClipboardList aria-hidden="true" size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">{t("reportsMenuHeading")}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("reportsMenuDescription")}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-white transition hover:bg-emerald-950"
              href="/admin/reports"
            >
              <ClipboardList aria-hidden="true" size={16} strokeWidth={2.2} />
              {t("reportsAdminButton")}
            </Link>
          </div>
        </section>
    </>
  );
}
