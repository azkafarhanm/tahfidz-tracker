import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAdminScope } from "@/lib/session";
import { Calendar, CheckCircle2, Eye, PlusCircle, XCircle, Archive, RotateCcw } from "lucide-react";
import { getAdminAcademicYearsData, setActiveAcademicYear } from "./actions";
import { archiveAcademicYear, restoreAcademicYear } from "./archive-actions";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";
import { badge, alert } from "@/lib/colors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminFormPage");
  return { title: `${t("academicYears")} - Admin - TahfidzFlow` };
}

type AcademicYearsPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function AcademicYearsPage({ searchParams }: AcademicYearsPageProps) {
  await requireAdminScope();
  const [params, years, t] = await Promise.all([
    searchParams,
    getAdminAcademicYearsData(),
    getTranslations("AdminAcademicYear"),
  ]);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              href="/admin"
            >
              {t("backToAdmin")}
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">{t("title")}</h1>
          </div>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98]"
            href="/admin/academic-years/new"
          >
            <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
            {t("addYear")}
          </Link>
        </header>

        {params?.success ? (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${alert.success}`}>
            {params.success}
          </div>
        ) : null}

        {params?.error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {params.error}
          </div>
        ) : null}

        {years.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <Calendar aria-hidden="true" className="text-slate-400 dark:text-slate-500" size={32} />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("emptyState")}
            </p>
            <Link
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-950"
              href="/admin/academic-years/new"
            >
              <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
              {t("addYear")}
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {years.map((year) => (
              <article
                key={year.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{year.year}</h2>
                      {year.isActive ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ${badge.success}`}>
                          <CheckCircle2 aria-hidden="true" size={12} />
                          {t("active")}
                        </span>
                      ) : year.status === "ARCHIVED" ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ${badge.warning}`}>
                          <Archive aria-hidden="true" size={12} />
                          {t("archived")}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ${badge.neutral}`}>
                          <XCircle aria-hidden="true" size={12} />
                          {t("inactive")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {year.startDate} — {year.endDate}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {t("studentCount", { count: year.studentCount })} · {t("halaqahCount", { count: year.classGroupCount })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {year.status === "ARCHIVED" ? (
                      <Link
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        href={`/admin/academic-years/${year.id}`}
                      >
                        <Eye aria-hidden="true" size={14} strokeWidth={2.2} />
                        {t("viewDetails")}
                      </Link>
                    ) : null}
                    {!year.isActive && year.status !== "ARCHIVED" ? (
                      <ConfirmActionDialogButton
                        cancelLabel={t("cancel")}
                        confirmLabel={t("confirmActivate")}
                        confirmMessage={t("confirmActivateMessage", { year: year.year })}
                        dialogTitle={t("activateYear")}
                        icon={<CheckCircle2 aria-hidden="true" size={16} strokeWidth={2.2} />}
                        label={t("activate")}
                        onAction={setActiveAcademicYear.bind(null, year.id)}
                        pendingLabel={t("activating")}
                      />
                    ) : null}
                    {!year.isActive && year.status !== "ARCHIVED" ? (
                      <ConfirmActionDialogButton
                        cancelLabel={t("cancel")}
                        confirmLabel={t("confirmArchive")}
                        confirmMessage={t("confirmArchiveMessage", { year: year.year })}
                        dialogTitle={t("archiveYear")}
                        icon={<Archive aria-hidden="true" size={16} strokeWidth={2.2} />}
                        label={t("archive")}
                        onAction={archiveAcademicYear.bind(null, year.id)}
                        pendingLabel={t("archiving")}
                      />
                    ) : null}
                    {year.status === "ARCHIVED" ? (
                      <ConfirmActionDialogButton
                        cancelLabel={t("cancel")}
                        confirmLabel={t("confirmRestore")}
                        confirmMessage={t("confirmRestoreMessage", { year: year.year })}
                        dialogTitle={t("restoreYear")}
                        icon={<RotateCcw aria-hidden="true" size={16} strokeWidth={2.2} />}
                        label={t("restore")}
                        onAction={restoreAcademicYear.bind(null, year.id)}
                        pendingLabel={t("restoring")}
                      />
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
