import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAdminScope } from "@/lib/session";
import { createAcademicYear } from "../actions";
import { Calendar, PlusCircle } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminFormPage");
  return { title: `${t("addAcademicYear")} - Admin - TahfidzFlow` };
}

type NewAcademicYearPageProps = {
  searchParams?: Promise<{
    error?: string;
    year?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

export default async function NewAcademicYearPage({ searchParams }: NewAcademicYearPageProps) {
  await requireAdminScope();
  const [params, t, tForm] = await Promise.all([
    searchParams,
    getTranslations("AdminAcademicYear"),
    getTranslations("AdminFormPage"),
  ]);

  const currentYear = new Date().getFullYear();
  const defaultYear = `${currentYear}/${currentYear + 1}`;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header>
          <Link
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
            href="/admin/academic-years"
          >
            {tForm("backAcademicYears")}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{t("addYear")}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("addYearDescription")}
          </p>
        </header>

        {params?.error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {params.error}
          </div>
        ) : null}

        <form action={createAcademicYear} className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <Calendar aria-hidden="true" className="text-emerald-700 dark:text-emerald-400" size={18} strokeWidth={2.2} />
              <h2 className="font-semibold">{t("yearDetails")}</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("yearLabel")}
              </span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                defaultValue={params?.year ?? defaultYear}
                maxLength={9}
                name="year"
                placeholder="2026/2027"
                required
                type="text"
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t("yearHelp")}
              </p>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("startDateLabel")}
              </span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                defaultValue={params?.startDate ?? `${currentYear}-07-01`}
                name="startDate"
                required
                type="date"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("endDateLabel")}
              </span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                defaultValue={params?.endDate ?? `${currentYear + 1}-06-30`}
                name="endDate"
                required
                type="date"
              />
            </label>
          </section>

          <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <Link
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              href="/admin/academic-years"
            >
              {t("cancel")}
            </Link>
            <button
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98]"
              type="submit"
            >
              <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
              {t("saveYear")}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
