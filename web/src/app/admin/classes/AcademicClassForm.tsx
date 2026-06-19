"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Save,
  Hash,
  CalendarRange,
  PencilLine,
  PlusCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import FormAlert from "@/components/FormAlert";
import CharacterCounter from "@/components/CharacterCounter";
import { backLink } from "@/lib/colors";

const iconMap = {
  PlusCircle,
  PencilLine,
} satisfies Record<string, LucideIcon>;

type AcademicClassFormIcon = keyof typeof iconMap;

export type AcademicClassFormValues = {
  grade: string;
  section: string;
  isActive: boolean;
};

type AcademicClassFormProps = {
  action: (formData: FormData) => Promise<void>;
  activeAcademicYear: string;
  backHref: string;
  backLabel: string;
  description: string;
  error?: string;
  icon: AcademicClassFormIcon;
  submitLabel: string;
  title: string;
  values: AcademicClassFormValues;
  programType?: string;
};

export default function AcademicClassForm({
  action,
  activeAcademicYear,
  backHref,
  backLabel,
  description,
  error,
  icon: iconName,
  submitLabel,
  title,
  values,
  programType = "",
}: AcademicClassFormProps) {
  const t = useTranslations("AdminClassForm");
  const tc = useTranslations("CharacterCounter");
  const Icon = iconMap[iconName];
  const [sectionLength, setSectionLength] = useState(values.section.length);
  const isBoarding = programType === "BOARDING";

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
         <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              className={backLink}
              href={backHref}
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              {backLabel}
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <Icon aria-hidden="true" size={22} strokeWidth={2.3} />
          </div>
        </header>

        {error ? <FormAlert message={error} /> : null}

        <form action={action} className="mt-6 space-y-4">
          {programType && <input type="hidden" name="programType" value={programType} />}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <Hash
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("classDetails")}</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("gradeLevel")}
              </span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                defaultValue={values.grade}
                max={12}
                min={1}
                name="grade"
                placeholder={t("gradePlaceholder")}
                required
                type="number"
              />
            </label>

            {!isBoarding && (
              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("classSection")}
                </span>
                <input
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                  defaultValue={values.section}
                  maxLength={5}
                  name="section"
                  onChange={(e) => setSectionLength(e.target.value.length)}
                  placeholder={t("sectionPlaceholder")}
                  required
                  type="text"
                />
                <CharacterCounter current={sectionLength} max={5} maxReachedLabel={tc("maxReached")} />
              </label>
            )}

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("className")}
              </span>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {isBoarding ? t("classNameDescriptionBoarding") : t("classNameDescription")}
              </p>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <CalendarRange
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("academicYear")}</h2>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("activeAcademicYear")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                {activeAcademicYear}
              </p>
            </div>

            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <input
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-900 focus:ring-emerald-500"
                defaultChecked={values.isActive}
                name="isActive"
                type="checkbox"
              />
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {t("classActive")}
                </span>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t("classActiveDescription")}
                </p>
              </div>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                <GraduationCap aria-hidden="true" size={18} strokeWidth={2.2} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">{t("adminNotes")}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {t("adminNotesDescription")}
                </p>
              </div>
            </div>
          </section>

          <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <Link
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              href={backHref}
            >
              {t("cancel")}
            </Link>
            <button
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98]"
              type="submit"
            >
              <Save aria-hidden="true" size={17} strokeWidth={2.2} />
              {submitLabel}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
