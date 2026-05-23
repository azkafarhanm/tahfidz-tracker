"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { deactivateTeacherStudent } from "./edit/actions";

export default function DeactivateButton({ studentId }: { studentId: string }) {
  const t = useTranslations("DeactivateStudent");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirmed) {
    return (
      <div className="flex flex-col items-end gap-1">
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <button
          className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-400"
          onClick={() => { setConfirmed(true); setError(null); }}
          type="button"
        >
          {t("buttonDeactivate")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl bg-red-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await deactivateTeacherStudent(studentId);
              if (result.ok) {
                setConfirmed(false);
                router.refresh();
              } else {
                setConfirmed(false);
                setError(result.error);
              }
            });
          }}
          type="button"
        >
          {isPending ? t("buttonProcessing") : t("buttonConfirm")}
        </button>
        <button
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          onClick={() => setConfirmed(false)}
          type="button"
        >
          {t("buttonCancel")}
        </button>
      </div>
    </div>
  );
}
