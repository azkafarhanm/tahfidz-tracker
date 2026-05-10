"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Layers,
  UserCheck,
  Signal,
  GraduationCap,
  CalendarDays,
  PencilLine,
  PlusCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

const iconMap: Record<string, LucideIcon> = {
  PlusCircle,
  PencilLine,
};

type TeacherOption = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  label: string;
};

export type ClassGroupFormValues = {
  name: string;
  description: string;
  level: string;
  teacherId: string;
  academicYear: string;
  grade: string;
  isActive: boolean;
};

type ClassGroupFormProps = {
  action: (formData: FormData) => Promise<void>;
  backHref: string;
  backLabel: string;
  description: string;
  error?: string;
  icon: string;
  submitLabel: string;
  teachers: TeacherOption[];
  academicYears: string[];
  title: string;
  values: ClassGroupFormValues;
};

export default function ClassGroupForm({
  action,
  backHref,
  backLabel,
  description,
  error,
  icon: iconName,
  submitLabel,
  teachers,
  academicYears,
  title,
  values,
}: ClassGroupFormProps) {
  const t = useTranslations("AdminHalaqahForm");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(
    values.academicYear,
  );

  const Icon = iconMap[iconName] ?? PlusCircle;

  const levelDescriptions: Record<string, string> = {
    LOW: t("levelLowDescription"),
    MEDIUM: t("levelMediumDescription"),
    HIGH: t("levelHighDescription"),
  };

  const gradeOptions = [
    { value: "7", label: t("grade7") },
    { value: "8", label: t("grade8") },
    { value: "9", label: t("grade9") },
  ];

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
         <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
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

        {error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
            {error}
          </div>
        ) : null}

        <form action={action} className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <UserCheck
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("nameAndTeacher")}</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("halaqahName")}
              </span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                defaultValue={values.name}
                maxLength={120}
                name="name"
                placeholder={t("halaqahNamePlaceholder")}
                required
                type="text"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("responsibleTeacher")}
              </span>
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                defaultValue={values.teacherId}
                name="teacherId"
                required
              >
                <option value="">{t("selectTeacher")}</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.label}
                    {teacher.isActive ? "" : ` - ${t("inactive")}`}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <GraduationCap
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("halaqahScope")}</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("academicYear")}
              </span>
              <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:ring-emerald-900">
                <CalendarDays
                  aria-hidden="true"
                  className="shrink-0 text-slate-400 dark:text-slate-500"
                  size={17}
                  strokeWidth={2.2}
                />
                <select
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none dark:text-white"
                  name="academicYear"
                  onChange={(event) => setSelectedAcademicYear(event.target.value)}
                  value={selectedAcademicYear}
                >
                  {academicYears.map((academicYear) => (
                    <option key={academicYear} value={academicYear}>
                      {academicYear}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("halaqahClass")}
              </span>
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                defaultValue={values.grade}
                name="grade"
                required
              >
                <option value="">{t("selectClass")}</option>
                {gradeOptions.map((grade) => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t("halaqahClassDescription")}
              </p>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <Signal
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("halaqahLevel")}</h2>
            </div>

            <div className="mt-4 space-y-3">
              {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
                <label
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50 has-[:checked]:ring-2 has-[:checked]:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:has-[:checked]:border-emerald-400 dark:has-[:checked]:bg-emerald-950 dark:has-[:checked]:ring-emerald-900"
                  key={level}
                >
                  <input
                    className="mt-1 h-4 w-4 shrink-0 border-slate-300 text-emerald-900 focus:ring-emerald-500"
                    defaultChecked={values.level === level}
                    name="level"
                    type="radio"
                    value={level}
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-950 dark:text-white">
                      {level === "LOW"
                        ? t("levelLow")
                        : level === "MEDIUM"
                          ? t("levelMedium")
                          : t("levelHigh")}
                    </span>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {levelDescriptions[level]}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("description")}
              </span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                defaultValue={values.description}
                maxLength={500}
                name="description"
                placeholder={t("descriptionPlaceholder")}
                rows={3}
              />
            </label>

            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <input
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-900 focus:ring-emerald-500"
                defaultChecked={values.isActive}
                name="isActive"
                type="checkbox"
              />
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {t("halaqahActive")}
                </span>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t("halaqahActiveDescription")}
                </p>
              </div>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                <Layers aria-hidden="true" size={18} strokeWidth={2.2} />
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
