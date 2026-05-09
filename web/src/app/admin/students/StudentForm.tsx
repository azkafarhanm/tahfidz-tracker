"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  GraduationCap,
  PencilLine,
  Save,
  School,
  ShieldCheck,
  UserRound,
  UserPlus,
  BookOpen,
  Signal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  UserPlus,
  PencilLine,
};

type StudentOption = {
  id: string;
  label: string;
  isActive: boolean;
};

type ClassGroupOption = StudentOption & {
  teacherId: string;
  grade: number;
  gradeLabel: string;
  academicYear: string;
  level: string;
  levelLabel: string;
  name: string;
  teacherName: string;
};

type AcademicClassOption = StudentOption & {
  grade: number;
  name: string;
  academicYear: string;
};

export type StudentFormValues = {
  fullName: string;
  teacherId: string;
  academicYear: string;
  academicClassId: string;
  gender: string;
  joinDate: string;
  isActive: boolean;
  notes: string;
};

type StudentFormProps = {
  action: (formData: FormData) => Promise<void>;
  backHref: string;
  backLabel: string;
  description: string;
  error?: string;
  icon: string;
  options: {
    teachers: StudentOption[];
    classGroups: ClassGroupOption[];
    academicClasses: AcademicClassOption[];
    academicYears: string[];
  };
  submitLabel: string;
  title: string;
  values: StudentFormValues;
};

export default function StudentForm({
  action,
  backHref,
  backLabel,
  description,
  error,
  icon: iconName,
  options,
  submitLabel,
  title,
  values,
}: StudentFormProps) {
  const t = useTranslations("AdminStudentForm");
  const [selectedTeacherId, setSelectedTeacherId] = useState(values.teacherId);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(
    values.academicYear,
  );
  const [selectedAcademicClassId, setSelectedAcademicClassId] = useState(
    values.academicClassId,
  );
  const [isPending, startTransition] = useTransition();

  const genderOptions = [
    { value: "MALE", label: t("male") },
    { value: "FEMALE", label: t("female") },
  ];

  const filteredAcademicClasses = useMemo(
    () =>
      options.academicClasses.filter(
        (academicClass) => academicClass.academicYear === selectedAcademicYear,
      ),
    [options.academicClasses, selectedAcademicYear],
  );

  const selectedAcademicClass = useMemo(
    () =>
      options.academicClasses.find(
        (academicClass) => academicClass.id === selectedAcademicClassId,
      ) ?? null,
    [options.academicClasses, selectedAcademicClassId],
  );

  const teacherClassGroups = useMemo(
    () =>
      selectedTeacherId
        ? options.classGroups.filter(
            (classGroup) => classGroup.teacherId === selectedTeacherId,
          )
        : [],
    [options.classGroups, selectedTeacherId],
  );

  const resolvedClassGroup = useMemo(() => {
    if (!selectedTeacherId || !selectedAcademicClass) {
      return null;
    }

    return (
      teacherClassGroups.find(
        (classGroup) =>
          classGroup.academicYear === selectedAcademicClass.academicYear &&
          classGroup.grade === selectedAcademicClass.grade,
      ) ?? null
    );
  }, [selectedAcademicClass, selectedTeacherId, teacherClassGroups]);

  function handleAcademicYearChange(newAcademicYear: string) {
    setSelectedAcademicYear(newAcademicYear);

    const stillMatches = options.academicClasses.some(
      (academicClass) =>
        academicClass.id === selectedAcademicClassId &&
        academicClass.academicYear === newAcademicYear,
    );

    if (!stillMatches) {
      setSelectedAcademicClassId("");
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
    });
  }

  const Icon = iconMap[iconName] ?? UserRound;

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

        <form action={handleSubmit} className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <UserRound
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("studentData")}</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("fullName")}
              </span>
              <input
                autoComplete="name"
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                defaultValue={values.fullName}
                maxLength={120}
                name="fullName"
                placeholder={t("fullNamePlaceholder")}
                required
                type="text"
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("gender")}
                </span>
                <select
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
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
                  {t("joinDate")}
                </span>
                <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:ring-emerald-900">
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
                    required
                    type="date"
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <School
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("classAndHalaqah")}</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                 {t("academicYear")}
               </span>
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                name="academicYear"
                onChange={(event) => handleAcademicYearChange(event.target.value)}
                value={selectedAcademicYear}
              >
                {options.academicYears.map((academicYear) => (
                  <option key={academicYear} value={academicYear}>
                    {academicYear}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
               <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                 {t("academicClass")}
               </span>
              <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:ring-emerald-900">
                 <GraduationCap
                   aria-hidden="true"
                   className="shrink-0 text-slate-400 dark:text-slate-500"
                  size={17}
                  strokeWidth={2.2}
                />
                <select
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none dark:text-white"
                  name="academicClassId"
                  onChange={(event) => setSelectedAcademicClassId(event.target.value)}
                  required
                  value={selectedAcademicClassId}
                >
                  <option value="">{t("selectAcademicClass")}</option>
                  {filteredAcademicClasses.map((academicClass) => (
                    <option key={academicClass.id} value={academicClass.id}>
                      {academicClass.label}
                      {academicClass.isActive ? "" : ` - ${t("inactive")}`}
                    </option>
                  ))}
                </select>
              </div>
               <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                 {t("academicClassDescription")}
               </p>
            </label>

            <label className="mt-4 block">
               <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                 {t("tahfidzTeacher")}
               </span>
              <select
                 className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                name="teacherId"
                onChange={(event) => setSelectedTeacherId(event.target.value)}
                required
                value={selectedTeacherId}
              >
                <option value="">{t("selectTeacher")}</option>
                {options.teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.label}
                    {teacher.isActive ? "" : ` - ${t("inactive")}`}
                  </option>
                ))}
              </select>
            </label>

            {selectedTeacherId && selectedAcademicClass && !resolvedClassGroup ? (
              <p className="mt-4 text-sm text-amber-600">
                {t("noHalaqahWarning", { year: selectedAcademicYear, grade: selectedAcademicClass.grade })}
              </p>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <BookOpen
                    aria-hidden="true"
                    className="text-emerald-800 dark:text-emerald-400"
                    size={16}
                    strokeWidth={2.2}
                  />
                  {t("connectedHalaqah")}
                </div>
                <p className="mt-2 text-sm text-slate-950 dark:text-white">
                  {resolvedClassGroup?.name ?? t("connectedHalaqahEmpty")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Signal
                    aria-hidden="true"
                    className="text-emerald-800 dark:text-emerald-400"
                    size={16}
                    strokeWidth={2.2}
                  />
                  {t("halaqahLevel")}
                </div>
                <p className="mt-2 text-sm text-slate-950 dark:text-white">
                  {resolvedClassGroup?.levelLabel ?? t("halaqahLevelEmpty")}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <FileText
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("notesAndStatus")}</h2>
            </div>

            <textarea
              className="mt-4 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
              defaultValue={values.notes}
              maxLength={1500}
              name="notes"
              placeholder={t("notesPlaceholder")}
            />

            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <input
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-900 focus:ring-emerald-500"
                defaultChecked={values.isActive}
                name="isActive"
                type="checkbox"
              />
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {t("studentActive")}
                </span>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t("studentActiveDescription")}
                </p>
              </div>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                <ShieldCheck aria-hidden="true" size={18} strokeWidth={2.2} />
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
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98] disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              <Save aria-hidden="true" size={17} strokeWidth={2.2} />
              {isPending ? t("saving") : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
