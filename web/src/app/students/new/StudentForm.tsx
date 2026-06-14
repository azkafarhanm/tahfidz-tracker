"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Lock,
  Save,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import FormAlert from "@/components/FormAlert";
import CharacterCounter from "@/components/CharacterCounter";
import { backLink } from "@/lib/colors";

type ClassGroupOption = {
  id: string;
  name: string;
  level: string;
  levelKey: string;
  grade: number;
  teacherName: string;
  label: string;
};

type AcademicClassOption = {
  id: string;
  name: string;
  grade: number;
  label: string;
};

type TeacherStudentFormProps = {
  action: (formData: FormData) => Promise<void>;
  backHref: string;
  error?: string;
  options: {
    classGroups: ClassGroupOption[];
    academicClasses: AcademicClassOption[];
  };
  values: {
    fullName: string;
    classGroupId: string;
    halaqahLevel: string;
    grade: string;
    academicClassId: string;
    gender: string;
    joinDate: string;
    notes: string;
  };
};

export default function TeacherStudentForm({
  action,
  backHref,
  error,
  options,
  values,
}: TeacherStudentFormProps) {
  const t = useTranslations("StudentForm");
  const tc = useTranslations("CharacterCounter");
  const [selectedLevel, setSelectedLevel] = useState(values.halaqahLevel);
  const [selectedGrade, setSelectedGrade] = useState(values.grade);
  const [selectedAcademicClassId, setSelectedAcademicClassId] = useState(values.academicClassId);
  const [nameLength, setNameLength] = useState(values.fullName.length);
  const [notesLength, setNotesLength] = useState(values.notes.length);

  // Filter academic classes by selected grade
  const filteredAcademicClasses = selectedGrade
    ? options.academicClasses.filter((ac) => ac.grade === Number(selectedGrade))
    : options.academicClasses;

  // Find existing halaqah for selected grade
  const gradeHasExistingCg = selectedGrade
    ? options.classGroups.find((g) => g.grade === Number(selectedGrade)) ?? null
    : null;

  const lockedLevel = gradeHasExistingCg?.levelKey ?? null;

  // Lock level when grade has existing halaqah
  useEffect(() => {
    if (lockedLevel && selectedLevel !== lockedLevel) {
      setSelectedLevel(lockedLevel);
    }
  }, [lockedLevel, selectedLevel]);

  // Auto-set grade when academic class is selected
  function handleAcademicClassChange(academicClassId: string) {
    setSelectedAcademicClassId(academicClassId);
    const ac = options.academicClasses.find((c) => c.id === academicClassId);
    if (ac) {
      setSelectedGrade(String(ac.grade));
      // Check if level should be locked for this grade
      const cg = options.classGroups.find((g) => g.grade === ac.grade);
      if (cg) {
        setSelectedLevel(cg.levelKey);
      }
    }
  }

  function handleGradeChange(grade: string) {
    setSelectedGrade(grade);
    // Clear academic class if it doesn't match new grade
    const ac = options.academicClasses.find((c) => c.id === selectedAcademicClassId);
    if (ac && ac.grade !== Number(grade)) {
      setSelectedAcademicClassId("");
    }
    // Check if level should be locked for new grade
    const cg = options.classGroups.find((g) => g.grade === Number(grade));
    if (cg) {
      setSelectedLevel(cg.levelKey);
    }
  }

  function handleLevelClick(levelKey: string) {
    if (!lockedLevel) {
      setSelectedLevel(levelKey);
    }
  }

  const genderOptions = [
    { value: "MALE", label: t("genderMale") },
    { value: "FEMALE", label: t("genderFemale") },
  ];

  const gradeOptions = [
    { value: "7", label: t("grade7") },
    { value: "8", label: t("grade8") },
    { value: "9", label: t("grade9") },
  ];

  const levelBaseSubtitle = gradeHasExistingCg
    ? gradeHasExistingCg.teacherName
    : null;

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
              Santri
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("description")}
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <UserRound aria-hidden="true" size={22} strokeWidth={2.3} />
          </div>
        </header>

        {error ? <FormAlert message={error} /> : null}

        <form action={action} className="mt-6 space-y-4">
          <input
            name="classGroupId"
            type="hidden"
            value={
              selectedLevel && selectedGrade
                ? matchedCg?.id ?? ""
                : values.classGroupId
            }
          />
          <input name="halaqahLevel" type="hidden" value={selectedLevel} />
          <input name="grade" type="hidden" value={selectedGrade} />

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
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                defaultValue={values.fullName}
                maxLength={120}
                name="fullName"
                onChange={(e) => setNameLength(e.target.value.length)}
                placeholder={t("placeholderName")}
                required
                type="text"
              />
              <CharacterCounter current={nameLength} max={120} maxReachedLabel={tc("maxReached")} />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("labelGender")}
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
                  {t("labelJoinDate")}
                </span>
                <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:ring-emerald-900">
                  <CalendarDays
                    aria-hidden="true"
                    className="shrink-0 text-slate-400"
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
                    aria-pressed={isSelected}
                    className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition active:scale-[0.97] ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-800"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-600"
                    }`}
                    key={g.value}
                    onClick={() => handleGradeChange(g.value)}
                    type="button"
                  >
                    <span
                      className={`text-sm font-bold ${
                        isSelected ? "text-emerald-900" : "text-slate-950 dark:text-white"
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
                const isSelected = selectedLevel === lv.key;
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
                      {levelBaseSubtitle ?? lv.desc}
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
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("labelAcademicClass")}
              </span>
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                name="academicClassId"
                onChange={(e) => handleAcademicClassChange(e.target.value)}
                required
                value={selectedAcademicClassId}
              >
                <option value="">{t("academicClassPlaceholder")}</option>
                {filteredAcademicClasses.map((ac) => (
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
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                defaultValue={values.notes}
                maxLength={1500}
                name="notes"
                onChange={(e) => setNotesLength(e.target.value.length)}
                placeholder={t("placeholderNotes")}
                rows={3}
              />
              <CharacterCounter current={notesLength} max={1500} maxReachedLabel={tc("maxReached")} />
            </label>
          </section>

          <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <Link
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              href={backHref}
            >
              {t("buttonCancel")}
            </Link>
            <SubmitButton
              canSubmit={Boolean(selectedLevel && selectedGrade)}
              idleLabel={t("buttonSave")}
              pendingLabel={t("buttonSaving")}
            />
          </div>
        </form>
      </section>
    </main>
  );
}

function SubmitButton({
  canSubmit,
  idleLabel,
  pendingLabel,
}: {
  canSubmit: boolean;
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98] disabled:opacity-60"
      disabled={!canSubmit || pending}
      type="submit"
    >
      <Save aria-hidden="true" size={17} strokeWidth={2.2} />
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
