"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { deactivateTeacherStudent } from "./edit/actions";

export default function DeactivateButton({ studentId }: { studentId: string }) {
  const t = useTranslations("DeactivateStudent");
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  if (!confirmed) {
    return (
      <button
        className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
        onClick={() => setConfirmed(true)}
        type="button"
      >
        {t("buttonDeactivate")}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded-xl bg-red-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await deactivateTeacherStudent(studentId);
          });
        }}
        type="button"
      >
        {isPending ? t("buttonProcessing") : t("buttonConfirm")}
      </button>
      <button
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        onClick={() => setConfirmed(false)}
        type="button"
      >
        {t("buttonCancel")}
      </button>
    </div>
  );
}
