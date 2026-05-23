"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteTeacherStudent } from "@/app/students/[id]/edit/actions";

type DeleteStudentButtonProps = {
  disabledReason?: string;
  studentId: string;
};

export default function DeleteStudentButton({
  disabledReason,
  studentId,
}: DeleteStudentButtonProps) {
  const t = useTranslations("DeleteStudent");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (disabledReason) {
    return (
      <div className="flex min-w-0 flex-col items-end gap-1">
        <button
          aria-disabled="true"
          className="inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-400 opacity-70 dark:border-red-950 dark:bg-slate-900 dark:text-red-500"
          onClick={(event) => event.preventDefault()}
          type="button"
        >
          <Trash2 aria-hidden="true" size={14} strokeWidth={2.2} />
          {t("buttonDelete")}
        </button>
        <p className="max-w-72 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
          {disabledReason}
        </p>
      </div>
    );
  }

  if (!confirmed) {
    return (
      <div className="flex flex-col items-end gap-1">
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <button
          className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950"
          onClick={() => { setConfirmed(true); setError(null); }}
          type="button"
        >
          {t("buttonDelete")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded-xl bg-red-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await deleteTeacherStudent(studentId);
            if (result.ok) {
              setConfirmed(false);
              router.refresh();
            } else {
              setConfirmed(false);
              setError(result.error);
              router.refresh();
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
  );
}
