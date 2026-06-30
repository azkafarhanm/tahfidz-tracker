"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  GraduationCap,
  Lock,
  PencilLine,
  Save,
  School,
  ShieldCheck,
  UserRound,
  UserPlus,
  Users,
  BookOpen,
  Signal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import FormAlert from "@/components/FormAlert";
import CharacterCounter from "@/components/CharacterCounter";
import HalaqahLevelDialog from "@/components/HalaqahLevelDialog";
import { backLink } from "@/lib/colors";

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
  programType: string;
};

type AcademicClassOption = StudentOption & {
  grade: number;
  name: string;
  academicYear: string;
  programType: string;
};

export type StudentFormValues = {
  fullName: string;
  teacherId: string;
  academicClassId: string;
  gender: string;
  joinDate: string;
  isActive: boolean;
  notes: string;
};

export type HalaqahInfo = {
  classGroupId: string;
  name: string;
  level: string;
  levelLabel: string;
  grade: number;
  studentCount: number;
};

type StudentFormProps = {
  action: (formData: FormData) => Promise<void>;
  backHref: string;
  backLabel: string;
  description: string;
  error?: string;
  icon: string;
  activeAcademicYear: string;
  options: {
    teachers: StudentOption[];
    classGroups: ClassGroupOption[];
    academicClasses: AcademicClassOption[];
  };
  submitLabel: string;
  title: string;
  values: StudentFormValues;
  programType?: string;
  /** Supplied on Edit to render the halaqah card + Edit Level button. */
  halaqah?: HalaqahInfo;
  /** Initial level for the selector (Edit). */
  initialLevel?: string;
};

export default function StudentForm({
  action,
  backHref,
  backLabel,
  description,
  error,
  icon: iconName,
  activeAcademicYear,
  options,
  submitLabel,
  title,
  values,
  programType = "",
  halaqah,
  initialLevel = "",
}: StudentFormProps) {
  const t = useTranslations("AdminStudentForm");
  const tc = useTranslations("CharacterCounter");
  const [selectedTeacherId, setSelectedTeacherId] = useState(values.teacherId);
  const [selectedAcademicClassId, setSelectedAcademicClassId] = useState(
    values.academicClassId,
  );
  const [isPending, startTransition] = useTransition();
  const [nameLength, setNameLength] = useState(values.fullName.length);
  const [notesLength, setNotesLength] = useState(values.notes.length);
  // Stateful mirror of the halaqah card data so an in-place level change from
  // the Edit Level dialog updates the card/selector instantly, without waiting
  // for the router.refresh() revalidation to land (mirrors the Teacher Edit form).
  const [halaqahState, setHalaqahState] = useState(halaqah);

  const genderOptions = [
    { value: "MALE", label: t("male") },
    { value: "FEMALE", label: t("female") },
  ];

  const isBoarding = programType === "BOARDING";

  const filteredAcademicClasses = useMemo(
    () =>
      options.academicClasses.filter(
        (academicClass) =>
          academicClass.academicYear === activeAcademicYear &&
          (!programType || academicClass.programType === programType),
      ),
    [options.academicClasses, activeAcademicYear, programType],
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

  const [selectedLevel, setSelectedLevel] = useState(
    initialLevel || resolvedClassGroup?.level || "",
  );

  // Once a halaqah exists for the selected teacher + academic class grade, its
  // level is locked (mirrors the Teacher flow). The selector stays visible so
  // the active level is shown; editing happens elsewhere (out of scope here).
  // Prefer halaqahState (local, updated immediately by Edit Level dialog) over
  // resolvedClassGroup (server props, stale until router.refresh() lands).
  const lockedLevel = !isBoarding ? (halaqahState?.level ?? resolvedClassGroup?.level ?? null) : null;
  const effectiveLevel = lockedLevel ?? selectedLevel;

  // When the teacher/class selection changes and a halaqah resolves, sync the
  // selector to that halaqah's level; otherwise reset to allow a fresh choice.
  useEffect(() => {
    if (resolvedClassGroup) {
      setSelectedLevel(resolvedClassGroup.level);
    } else {
      setSelectedLevel("");
    }
  }, [resolvedClassGroup]);

  function handleLevelClick(levelKey: string) {
    if (!lockedLevel) {
      setSelectedLevel(levelKey);
    }
  }

  // Reflect an in-place level change from the Edit Level dialog (Edit page).
  // Updates both the selector and the card's displayed level immediately, so
  // the UI does not lag behind the delayed router.refresh() revalidation.
  function handleLevelUpdated(level: string, levelLabel?: string) {
    setSelectedLevel(level);
    setHalaqahState((current) =>
      current
        ? { ...current, level, levelLabel: levelLabel ?? current.levelLabel }
        : current,
    );
  }

  const levels = [
    { key: "LOW", label: "Low", desc: t("levelBeginner") },
    { key: "MEDIUM", label: "Medium", desc: t("levelIntermediate") },
    { key: "HIGH", label: "High", desc: t("levelAdvanced") },
  ];

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

        <form action={handleSubmit} className="mt-6 space-y-4">
          {programType && <input type="hidden" name="programType" value={programType} />}
          <input type="hidden" name="halaqahLevel" value={isBoarding ? "LOW" : effectiveLevel} />
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
                onChange={(e) => setNameLength(e.target.value.length)}
                placeholder={t("fullNamePlaceholder")}
                required
                type="text"
              />
              <CharacterCounter current={nameLength} max={120} maxReachedLabel={tc("maxReached")} />
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
              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("activeAcademicYear")}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                  {activeAcademicYear}
                </p>
              </div>
            </label>

            <label className="mt-4 block">
               <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                 {isBoarding ? t("boardingClass") : t("academicClass")}
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
                  <option value="">{isBoarding ? t("selectBoardingClass") : t("selectAcademicClass")}</option>
                  {filteredAcademicClasses.map((academicClass) => (
                    <option key={academicClass.id} value={academicClass.id}>
                      {academicClass.label}
                      {academicClass.isActive ? "" : ` - ${t("inactive")}`}
                    </option>
                  ))}
                </select>
              </div>
               <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                 {isBoarding ? t("boardingClassDescription") : t("academicClassDescription")}
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

            {!isBoarding ? (
              <>
                {/* Halaqah card with Edit Level button (Edit page only). Mirrors
                    the Teacher Edit card; reuses the shared HalaqahLevelDialog +
                    shared role-aware updateHalaqahLevel action. Reads from
                    halaqahState so an in-place level change shows immediately. */}
                {halaqahState ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-950 dark:text-white">
                          {halaqahState.name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap aria-hidden="true" size={14} />
                            {t("grade")}: {halaqahState.grade}
                          </span>
                          <span className="hidden md:inline">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Lock aria-hidden="true" size={14} />
                            {t("level")}: {halaqahState.levelLabel}
                          </span>
                          <span className="hidden md:inline">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Users aria-hidden="true" size={14} />
                            {t("students")}: {halaqahState.studentCount}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <HalaqahLevelDialog
                          classGroupId={halaqahState.classGroupId}
                          currentLevel={halaqahState.level}
                          currentLevelLabel={halaqahState.levelLabel}
                          halaqahName={halaqahState.name}
                          grade={halaqahState.grade}
                          studentCount={halaqahState.studentCount}
                          onLevelUpdated={(level, levelLabel) => handleLevelUpdated(level, levelLabel)}
                        />
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      {t("halaqahHelperText")}
                    </p>
                  </div>
                ) : null}

                {/* Connected halaqah status: shows the existing halaqah, or an
                    auto-create message when none exists yet (first student). */}
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
                      {resolvedClassGroup?.name ?? t("halaqahWillBeCreated")}
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
                      {halaqahState?.levelLabel ?? resolvedClassGroup?.levelLabel ?? t("halaqahLevelEmpty")}
                    </p>
                  </div>
                </div>

                {/* Level selector — visible always; locked once a halaqah exists.
                    On first student (no halaqah), choosing a level sets the
                    auto-create level. Mirrors the Teacher StudentForm. */}
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <Signal
                      aria-hidden="true"
                      className="text-emerald-800 dark:text-emerald-400"
                      size={16}
                      strokeWidth={2.2}
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("sectionLevel")}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {levels.map((lv) => {
                      const isSelected = effectiveLevel === lv.key;
                      const isLocked = lockedLevel && lockedLevel !== lv.key;
                      const isLockedSelected = lockedLevel === lv.key;
                      return (
                        <button
                          aria-pressed={isSelected}
                          aria-disabled={isLocked || undefined}
                          className={`flex min-h-[5.5rem] flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-800"
                              : isLocked
                                ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-40 dark:border-slate-800 dark:bg-slate-900"
                                : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-600"
                          }`}
                          key={lv.key}
                          onClick={() => handleLevelClick(lv.key)}
                          type="button"
                        >
                          <span
                            className={`flex items-center gap-1 text-sm font-bold ${
                              isSelected ? "text-emerald-900" : "text-slate-950 dark:text-white"
                            }`}
                          >
                            {lv.label}
                            {isLockedSelected ? <Lock aria-hidden="true" size={12} strokeWidth={2.5} /> : null}
                          </span>
                          <span className="mt-1 text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                            {lv.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {lockedLevel ? (
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Lock aria-hidden="true" size={11} />
                      {t("levelLockedHint")}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {t("levelSelectHint")}
                    </p>
                  )}
                </div>
              </>
            ) : null}
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
              onChange={(e) => setNotesLength(e.target.value.length)}
              placeholder={t("notesPlaceholder")}
            />
            <CharacterCounter current={notesLength} max={1500} maxReachedLabel={tc("maxReached")} />

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
              disabled={isPending || (!isBoarding && !effectiveLevel)}
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
