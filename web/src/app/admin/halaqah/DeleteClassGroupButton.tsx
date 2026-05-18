"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { deleteClassGroup } from "./actions";

export default function DeleteClassGroupButton({
  classGroupId,
  classGroupName,
}: {
  classGroupId: string;
  classGroupName: string;
}) {
  const t = useTranslations("AdminHalaqah");
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-2 dark:border-rose-900 dark:bg-rose-950/40">
        <span className="px-2 text-xs font-medium text-rose-800 dark:text-rose-300">
          {t("confirmDeleteMessage", { name: classGroupName })}
        </span>
        <button
          className="inline-flex min-h-9 items-center justify-center rounded-xl bg-rose-700 px-3 text-xs font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await deleteClassGroup(classGroupId);
            });
          }}
          type="button"
        >
          {isPending ? t("deletingButton") : t("confirmDeleteButton")}
        </button>
        <button
          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          disabled={isPending}
          onClick={() => setConfirmed(false)}
          type="button"
        >
          {t("cancelDeleteButton")}
        </button>
      </div>
    );
  }

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
      onClick={() => setConfirmed(true)}
      type="button"
    >
      <Trash2 aria-hidden="true" size={16} strokeWidth={2.2} />
      {t("deleteButton")}
    </button>
  );
}
