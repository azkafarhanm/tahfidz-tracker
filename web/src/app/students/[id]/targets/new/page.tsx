import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Hash,
  Target,
} from "lucide-react";
import { createTarget } from "@/lib/target-actions";
import { getStudentFormContext } from "@/lib/students";
import { todayInputValue } from "@/lib/format";
import { requireSessionScope } from "@/lib/session";
import SurahInput from "@/components/SurahInput";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NewTargetPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewTargetPage({ params, searchParams }: NewTargetPageProps) {
  const t = await getTranslations("TargetForm");
  const { teacherId } = await requireSessionScope();
  const { id } = await params;
  const query = await searchParams;

  const ctx = await getStudentFormContext(id, teacherId);
  if (!ctx) {
    notFound();
  }

  const action = createTarget.bind(null, id);
  const today = todayInputValue();
  const defaultEnd = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
            href={`/students/${id}`}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {ctx.fullName}
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <Target aria-hidden="true" size={20} strokeWidth={2.2} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">{t("titleAdd")}</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{ctx.classSummary}</p>
            </div>
          </div>
        </header>

        {query?.error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {query.error}
          </div>
        ) : null}

        <form
          action={action}
          className="mt-5 space-y-5"
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Target aria-hidden="true" className="text-emerald-800 dark:text-emerald-400" size={17} strokeWidth={2.2} />
              {t("labelType")}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-600 dark:has-[:checked]:bg-emerald-950 dark:has-[:checked]:text-emerald-400">
                <input className="sr-only" defaultChecked name="type" type="radio" value="HAFALAN" />
                {t("typeHafalan")}
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-600 dark:has-[:checked]:bg-emerald-950 dark:has-[:checked]:text-emerald-400">
                <input className="sr-only" name="type" type="radio" value="MUROJAAH" />
                {t("typeMurojaah")}
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Target aria-hidden="true" className="text-emerald-800 dark:text-emerald-400" size={17} strokeWidth={2.2} />
              {t("sectionMaterial")}
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="surah">{t("labelSurah")}</label>
                <SurahInput id="surah" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="fromAyah">{t("labelFromAyah")}</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:focus-within:border-emerald-400 dark:focus-within:ring-emerald-400/20">
                    <Hash aria-hidden="true" className="text-slate-400 dark:text-slate-500" size={14} strokeWidth={2.2} />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none dark:text-white"
                      id="fromAyah"
                      max={286}
                      min={1}
                      name="fromAyah"
                      placeholder="1"
                      required
                      type="number"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="toAyah">{t("labelToAyah")}</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:focus-within:border-emerald-400 dark:focus-within:ring-emerald-400/20">
                    <Hash aria-hidden="true" className="text-slate-400 dark:text-slate-500" size={14} strokeWidth={2.2} />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none dark:text-white"
                      id="toAyah"
                      max={286}
                      min={1}
                      name="toAyah"
                      placeholder="20"
                      required
                      type="number"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <CalendarDays aria-hidden="true" className="text-emerald-800 dark:text-emerald-400" size={17} strokeWidth={2.2} />
              {t("sectionSchedule")}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="startDate">{t("labelStart")}</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:shadow-none dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
                  defaultValue={today}
                  id="startDate"
                  name="startDate"
                  required
                  type="date"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="endDate">{t("labelDeadline")}</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:shadow-none dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
                  defaultValue={defaultEnd}
                  id="endDate"
                  name="endDate"
                  required
                  type="date"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <ClipboardList aria-hidden="true" className="text-emerald-800 dark:text-emerald-400" size={17} strokeWidth={2.2} />
              {t("labelNotes")}
            </div>
            <textarea
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:shadow-none dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
              name="notes"
              placeholder={t("placeholderNotes")}
              rows={3}
            />
          </section>

          <div className="sticky bottom-0 -mx-4 flex items-center gap-3 bg-[#f7f4ee]/90 px-4 pb-5 pt-3 backdrop-blur-sm sm:-mx-8 sm:px-8 dark:bg-[#0c0f1a]/90">
            <Link
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:shadow-none dark:hover:border-emerald-600 dark:hover:text-emerald-400"
              href={`/students/${id}`}
            >
              {t("buttonCancel")}
            </Link>
            <button
              className="flex-1 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-950 active:scale-[0.98]"
              type="submit"
            >
              {t("buttonSave")}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
