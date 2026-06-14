"use client";

import { useState, useTransition } from "react";
import { Settings, Save, X, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { updateHalaqahLevel } from "@/app/students/halaqah-actions";

type HalaqahLevelDialogProps = {
  classGroupId: string;
  currentLevel: string;
  currentLevelLabel: string;
  halaqahName: string;
  grade: number;
  studentCount: number;
};

const levels = [
  { key: "LOW", label: "Low" },
  { key: "MEDIUM", label: "Medium" },
  { key: "HIGH", label: "High" },
];

export default function HalaqahLevelDialog({
  classGroupId,
  currentLevel,
  currentLevelLabel,
  halaqahName,
  grade,
  studentCount,
}: HalaqahLevelDialogProps) {
  const t = useTranslations("HalaqahLevelDialog");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(currentLevel);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasChanged = selectedLevel !== currentLevel;

  function handleOpen() {
    setIsOpen(true);
    setSelectedLevel(currentLevel);
    setError(null);
    setSuccess(null);
  }

  function handleClose() {
    setIsOpen(false);
    setError(null);
    if (success) {
      setSuccess(null);
    }
  }

  function handleSave() {
    if (!hasChanged) {
      setIsOpen(false);
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateHalaqahLevel(classGroupId, selectedLevel);
      if (result.ok) {
        setSuccess(result.message);
        setIsOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      {/* Trigger Button + Success Message */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <button
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50 px-3 text-[15px] font-bold tracking-tight text-emerald-900 shadow-sm ring-2 ring-emerald-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-900"
          onClick={handleOpen}
          type="button"
        >
          <Settings aria-hidden="true" size={13} strokeWidth={2.2} />
          {t("manageHalaqah")}
        </button>

        {success ? (
          <p className="break-words text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
        ) : null}
      </div>

      {/* Dialog */}
      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              {t("dialogTitle")}
            </h3>

            {/* Current Info */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("currentHalaqah")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                {halaqahName}
              </p>
              <div className="mt-2 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span>{t("grade")}: {grade}</span>
                <span>·</span>
                <span>{t("level")}: {currentLevelLabel}</span>
                <span>·</span>
                <span>{t("students")}: {studentCount}</span>
              </div>
            </div>

            {/* Level Selection */}
            <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("selectNewLevel")}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {levels.map((lv) => {
                const isSelected = selectedLevel === lv.key;
                return (
                  <button
                    aria-pressed={isSelected}
                    className={`flex min-h-[3.5rem] items-center justify-center rounded-xl border-2 px-3 text-sm font-semibold transition-all duration-200 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    }`}
                    key={lv.key}
                    onClick={() => setSelectedLevel(lv.key)}
                    type="button"
                  >
                    {lv.label}
                  </button>
                );
              })}
            </div>

            {/* Warning */}
            {hasChanged ? (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={16} />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  {t("warningMessage", { count: studentCount })}
                </p>
              </div>
            ) : null}

            {/* Error */}
            {error ? (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            {/* Actions */}
            <div className="mt-5 flex gap-3">
              <button
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                onClick={handleClose}
                type="button"
              >
                <X aria-hidden="true" size={14} strokeWidth={2.2} />
                {t("cancel")}
              </button>
              <button
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-950 hover:shadow-md disabled:opacity-60"
                disabled={isPending || !hasChanged}
                onClick={handleSave}
                type="button"
              >
                <Save aria-hidden="true" size={14} strokeWidth={2.2} />
                {isPending ? t("saving") : t("save")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
