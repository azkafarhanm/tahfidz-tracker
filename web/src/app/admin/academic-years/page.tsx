import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAdminScope } from "@/lib/session";
import { Calendar, CheckCircle2, PlusCircle, XCircle } from "lucide-react";
import { getAdminAcademicYearsData, setActiveAcademicYear } from "./actions";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";

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
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
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
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{year.year}</h2>
                      {year.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold leading-tight text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                          <CheckCircle2 aria-hidden="true" size={12} />
                          {t("active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold leading-tight text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <XCircle aria-hidden="true" size={12} />
                          {t("inactive")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {year.startDate} — {year.endDate}
                    </p>
                  </div>
                  {!year.isActive ? (
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
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
