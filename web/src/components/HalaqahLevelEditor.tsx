"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { updateHalaqahLevel } from "@/app/students/halaqah-actions";

type HalaqahLevelEditorProps = {
  classGroupId: string;
  currentLevel: string;
  currentLevelLabel: string;
};

const levels = [
  { key: "LOW", label: "Low" },
  { key: "MEDIUM", label: "Medium" },
  { key: "HIGH", label: "High" },
];

export default function HalaqahLevelEditor({
  classGroupId,
  currentLevel,
  currentLevelLabel,
}: HalaqahLevelEditorProps) {
  const t = useTranslations("HalaqahLevelEditor");
  const router = useRouter();
  const [currentLevelState, setCurrentLevelState] = useState(currentLevel);
  const [currentLevelLabelState, setCurrentLevelLabelState] = useState(currentLevelLabel);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(currentLevel);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCurrentLevelState(currentLevel);
    setCurrentLevelLabelState(currentLevelLabel);
    setSelectedLevel(currentLevel);
  }, [currentLevel, currentLevelLabel]);

  function handleCancel() {
    setIsEditing(false);
    setSelectedLevel(currentLevelState);
    setError(null);
    setSuccess(null);
  }

  function handleSave() {
    if (selectedLevel === currentLevelState) {
      setIsEditing(false);
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateHalaqahLevel(classGroupId, selectedLevel);
      if (result.ok) {
        setCurrentLevelState(result.level);
        setCurrentLevelLabelState(result.levelLabel);
        setSelectedLevel(result.level);
        setSuccess(result.message);
        setIsEditing(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Lock aria-hidden="true" size={14} className="text-slate-400 dark:text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {currentLevelLabelState}
          </span>
        </div>
        <button
          className="text-xs font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
          onClick={() => setIsEditing(true)}
          type="button"
        >
          {t("editLevel")}
        </button>
        {success ? (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">{success}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {t("editLevelTitle")}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {levels.map((lv) => {
          const isSelected = selectedLevel === lv.key;
          return (
            <button
              aria-pressed={isSelected}
              className={`flex min-h-[3.5rem] items-center justify-center rounded-xl border-2 px-3 text-sm font-semibold transition ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
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
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      <div className="flex gap-2">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 disabled:opacity-60"
          disabled={isPending || selectedLevel === currentLevelState}
          onClick={handleSave}
          type="button"
        >
          <Save aria-hidden="true" size={14} strokeWidth={2.2} />
          {isPending ? t("saving") : t("save")}
        </button>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          onClick={handleCancel}
          type="button"
        >
          <X aria-hidden="true" size={14} strokeWidth={2.2} />
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
