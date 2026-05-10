"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  PencilLine,
  Save,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";

type ClassGroupOption = {
  id: string;
  name: string;
  level: string;
  levelKey: string;
  grade: number;
  label: string;
};

type AcademicClassOption = {
  id: string;
  name: string;
  label: string;
};

type EditStudentFormProps = {
  action: (formData: FormData) => Promise<void>;
  backHref: string;
  error?: string;
  options: {
    classGroups: ClassGroupOption[];
    academicClasses: AcademicClassOption[];
  };
  values: {
    fullName: string;
    academicClassId: string;
    gender: string;
    joinDate: string;
    notes: string;
    classGroupLevel: string;
    classGroupGrade: string;
  };
};

export default function EditStudentForm({
  action,
  backHref,
  error,
  options,
  values,
}: EditStudentFormProps) {
  const t = useTranslations("StudentForm");
  const [isPending, startTransition] = useTransition();
  const [selectedLevel, setSelectedLevel] = useState(values.classGroupLevel);
  const [selectedGrade, setSelectedGrade] = useState(values.classGroupGrade);

  const genderOptions = [
    { value: "MALE", label: t("genderMale") },
    { value: "FEMALE", label: t("genderFemale") },
  ];

  const gradeOptions = [
    { value: "7", label: t("grade7") },
    { value: "8", label: t("grade8") },
    { value: "9", label: t("grade9") },
  ];

  const levels = [
    { key: "LOW", label: "Low", desc: t("levelBeginner") },
    { key: "MEDIUM", label: "Medium", desc: t("levelIntermediate") },
    { key: "HIGH", label: "High", desc: t("levelAdvanced") },
  ];

  const matchedCg =
    selectedLevel && selectedGrade
      ? options.classGroups.find(
          (cg) =>
            cg.levelKey === selectedLevel &&
            cg.grade === Number(selectedGrade),
        ) ?? null
      : null;

  function handleSubmit(formData: FormData) {
    formData.set("classGroupId", matchedCg?.id ?? "");
    formData.set("halaqahLevel", selectedLevel);
    formData.set("grade", selectedGrade);
    startTransition(async () => {
      await action(formData);
    });
  }

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
              {values.fullName}
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {t("titleEdit")}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("descriptionEdit")}
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <PencilLine aria-hidden="true" size={22} strokeWidth={2.3} />
          </div>
        </header>

        {error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
            {error}
          </div>
        ) : null}

        <form action={handleSubmit} className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <UserRound
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("sectionData")}</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("labelName")}
              </span>
              <input
                autoComplete="name"
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-400"
                defaultValue={values.fullName}
                maxLength={120}
                name="fullName"
                placeholder={t("placeholderName")}
                required
                type="text"
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("labelGender")}
                </span>
                <select
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-400"
                  defaultValue={values.gender}
                  name="gender"
                >
                  <option value="">{t("genderNotSelected")}</option>
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("labelJoinDate")}
                </span>
                <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:ring-emerald-400">
                  <CalendarDays
                    aria-hidden="true"
                    className="shrink-0 text-slate-400 dark:text-slate-500"
                    size={17}
                    strokeWidth={2.2}
                  />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none dark:text-white"
                    defaultValue={values.joinDate}
                    name="joinDate"
                    type="date"
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <GraduationCap
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("sectionClass")}</h2>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {gradeOptions.map((g) => {
                const isSelected = selectedGrade === g.value;
                return (
                  <button
                    className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition active:scale-[0.97] ${
isSelected
  ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-200 dark:bg-emerald-950 dark:shadow-none dark:ring-emerald-800"
  : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50"
                    }`}
                    key={g.value}
                    onClick={() => setSelectedGrade(g.value)}
                    type="button"
                  >
                    <span
                      className={`text-sm font-bold ${
                        isSelected ? "text-emerald-900 dark:text-emerald-300" : "text-slate-950 dark:text-white"
                      }`}
                    >
                      {g.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <GraduationCap
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("sectionLevel")}</h2>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {levels.map((lv) => {
                const cg = selectedGrade
                  ? options.classGroups.find(
                      (classGroup) =>
                        classGroup.levelKey === lv.key &&
                        classGroup.grade === Number(selectedGrade),
                    ) ?? null
                  : null;
                const isSelected = selectedLevel === lv.key;
                return (
                  <button
                    className={`flex min-h-[5.5rem] flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition active:scale-[0.97] ${
isSelected
  ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-200 dark:bg-emerald-950 dark:shadow-none dark:ring-emerald-800"
  : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50"
                    }`}
                    key={lv.key}
                    onClick={() => setSelectedLevel(lv.key)}
                    type="button"
                  >
                    <span
                      className={`text-sm font-bold ${
                        isSelected ? "text-emerald-900 dark:text-emerald-300" : "text-slate-950 dark:text-white"
                      }`}
                    >
                      {lv.label}
                    </span>
                    <span className="mt-1 text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                      {cg ? cg.name : lv.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("labelAcademicClass")}
              </span>
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-400"
                defaultValue={values.academicClassId}
                name="academicClassId"
              >
                <option value="">{t("genderNotSelected")}</option>
                {options.academicClasses.map((ac) => (
                  <option key={ac.id} value={ac.id}>
                    {ac.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("labelNotes")}
              </span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-400"
                defaultValue={values.notes}
                maxLength={1500}
                name="notes"
                placeholder={t("placeholderNotes")}
                rows={3}
              />
            </label>
          </section>

          <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <Link
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              href={backHref}
            >
              {t("buttonCancel")}
            </Link>
            <button
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98] disabled:opacity-60"
              disabled={isPending || !selectedLevel || !selectedGrade}
              type="submit"
            >
              <Save aria-hidden="true" size={17} strokeWidth={2.2} />
              {isPending ? t("buttonSaving") : t("buttonSaveEdit")}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
