"use client";

import { useMemo, useState } from "react";
import {
  deriveRecordStatusFromScore,
  recordStatusDisplay,
} from "@/lib/record-status";
import NumericScoreInput from "@/components/NumericScoreInput";

type AutoRecordStatusFieldProps = {
  defaultScore?: number | null;
  scoreLabel: string;
  statusLabel: string;
  placeholder: string;
};

export default function AutoRecordStatusField({
  defaultScore,
  scoreLabel,
  statusLabel,
  placeholder,
}: AutoRecordStatusFieldProps) {
  const [score, setScore] = useState(defaultScore?.toString() ?? "");
  const status = useMemo(() => {
    if (score.trim() === "") return "";
    const parsedScore = Number.parseInt(score, 10);
    return Number.isFinite(parsedScore)
      ? deriveRecordStatusFromScore(parsedScore)
      : "";
  }, [score]);
  const statusText = recordStatusDisplay(status);

  return (
    <>
      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {scoreLabel}
        </span>
        <NumericScoreInput
          className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900/30"
          name="score"
          onChange={(event) => setScore(event.target.value)}
          placeholder={placeholder}
          value={score}
        />
      </label>

      <div className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {statusLabel}
        </span>
        <div
          aria-live="polite"
          className="mt-2 flex min-h-12 w-full items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-950 dark:border-slate-700 dark:bg-slate-800/70 dark:text-white"
        >
          {statusText}
        </div>
      </div>
    </>
  );
}
