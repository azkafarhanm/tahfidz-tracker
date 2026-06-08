import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookText,
  Download,
  FileText,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getTeacherReportData } from "@/lib/reports";
import AppShell from "@/components/AppShell";
import PdfExportLink from "@/components/PdfExportLink";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";

export async function generateMetadata() {
  const t = await getTranslations("Reports");
  return {
    title: `${t("heading")} - TahfidzFlow`,
  };
}

export default async function ReportsPage() {
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const t = await getTranslations("Reports");
  const locale = await getLocale();

  if (isAdmin && !teacherId) {
    redirect("/admin/reports");
  }

  if (!teacherId) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
        <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 sm:max-w-3xl sm:px-8">
          <div className="text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-blue-100 text-blue-900 shadow-lg">
              <BarChart3 size={28} strokeWidth={2} />
            </div>
            <h1 className="mt-6 text-2xl font-semibold">{t("adminOnlyHeading")}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {t("adminOnlyDescription")}
            </p>
          </div>
          <Link
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
            href="/admin"
          >
            <ArrowLeft size={17} strokeWidth={2.3} />
            {t("adminPanelLink")}
          </Link>
        </section>
      </main>
    );
  }

  const data = await getTeacherReportData(teacherId, locale);

  return (
    <AppShell currentPath="/reports" userName={session.user.name} isAdmin={isAdmin}>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
              href="/"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              {t("backLink")}
            </Link>
            <h1 className="mt-3 text-2xl font-semibold">{t("heading")}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("description")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
              href="/api/reports/export-teacher"
            >
              <Download aria-hidden="true" size={16} strokeWidth={2.2} />
              {t("excelButton")}
            </a>
            <PdfExportLink
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
              href="/api/reports/pdf-teacher"
              toastMessage={t("pdfToast")}
            >
              <FileText aria-hidden="true" size={16} strokeWidth={2.2} />
              {t("pdfButton")}
            </PdfExportLink>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <BarChart3 aria-hidden="true" size={22} strokeWidth={2.3} />
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">{t("avgScoreLabel")}</p>
              <p className="mt-3 text-4xl font-semibold">{data.avgScore ?? "-"}</p>
              <p className="mt-1 text-sm text-slate-300">
                {t("fromRecordsCount", { count: data.totalHafalan + data.totalMurojaah })}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">{t("needsReviewLabel")}</p>
              <p className="mt-1 text-xl font-semibold">{data.needsReviewCount}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("statActiveStudents")}</p>
            <p className="mt-2 text-2xl font-semibold">{data.studentCount}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("statHafalan")}</p>
            <p className="mt-2 text-2xl font-semibold">{data.totalHafalan}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("statMurojaah")}</p>
            <p className="mt-2 text-2xl font-semibold">{data.totalMurojaah}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("statActiveTargets")}</p>
            <p className="mt-2 text-2xl font-semibold">{data.activeTargetCount}</p>
          </article>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t("gradingLinksHeading")}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("gradingLinksDescription")}
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Link
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
              href="/formative"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  <BookText aria-hidden="true" size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {t("formativeButton")}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("formativeDescription")}
                  </p>
                </div>
              </div>
            </Link>
            <Link
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
              href="/summative"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  <ClipboardList aria-hidden="true" size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {t("summativeButton")}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("summativeDescription")}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {data.classGroups.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-lg font-semibold">{t("halaqahHeading")}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.classGroups.map((cg) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
                  key={cg.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-950 dark:text-white">{cg.name}</p>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                      {cg.level}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {cg.studentCount} {t("halaqahStudentCount")}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="text-lg font-semibold">{t("progressHeading")}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{t("tableName")}</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{t("tableHalaqah")}</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700 text-center dark:text-slate-300">{t("tableHafalan")}</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700 text-center dark:text-slate-300">{t("tableMurojaah")}</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700 text-center dark:text-slate-300">{t("tableSkor")}</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{t("tableLast")}</th>
                  <th className="pb-3 font-semibold text-slate-700 text-center dark:text-slate-300">{t("tableStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s) => (
                  <tr
                    className="border-b border-slate-100 dark:border-slate-800"
                    key={s.id}
                  >
                    <td className="py-3 pr-4 font-medium text-slate-950 dark:text-white">
                      {s.fullName}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{s.halaqahName}</td>
                    <td className="py-3 pr-4 text-center text-slate-900 dark:text-slate-100">
                      {s.hafalanCount}
                    </td>
                    <td className="py-3 pr-4 text-center text-slate-900 dark:text-slate-100">
                      {s.murojaahCount}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span
                        className={
                          s.avgScore >= 85
                            ? "font-semibold text-emerald-700"
                            : s.avgScore >= 70
                              ? "font-semibold text-amber-700"
                              : s.avgScore > 0
                                ? "font-semibold text-red-700"
                                : "text-slate-400"
                        }
                      >
                        {s.avgScore ?? "-"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{s.lastRange}</td>
                    <td className="py-3 text-center">
                      {s.needsReview ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                          <AlertTriangle aria-hidden="true" size={10} />
                          {t("badgeCek")}
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                          {s.lastStatus}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </AppShell>
  );
}
