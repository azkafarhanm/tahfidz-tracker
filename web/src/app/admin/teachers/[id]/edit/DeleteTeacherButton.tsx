"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteTeacher } from "../../actions";

export default function DeleteTeacherButton({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  const t = useTranslations("DeleteTeacher");
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  if (!confirmed) {
    return (
      <section className="mx-auto max-w-md rounded-2xl border border-red-200 bg-white p-4 shadow-sm sm:max-w-3xl sm:px-8 dark:border-red-900 dark:bg-slate-900 dark:shadow-none">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">{t("deleteAccount")}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("deleteAccountDescription", { name: teacherName })}
            </p>
          </div>
          <button
            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950"
            onClick={() => setConfirmed(true)}
            type="button"
          >
            {t("delete")}
          </button>
        </div>
      </section>
    );
  }

  return (
      <section className="mx-auto max-w-md rounded-2xl border border-red-300 bg-red-50 p-4 sm:max-w-3xl sm:px-8 dark:border-red-800 dark:bg-red-950">
        <p className="text-sm font-semibold text-red-900 dark:text-red-400">
          {t("confirmDeleteMessage", { name: teacherName })}
        </p>
        <p className="mt-1 text-xs text-red-700 dark:text-red-400">
          {t("hasStudentsWarning")}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button
            className="rounded-xl bg-red-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await deleteTeacher(teacherId);
              });
            }}
            type="button"
          >
            {isPending ? t("deleting") : t("confirmDelete")}
          </button>
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            onClick={() => setConfirmed(false)}
            type="button"
          >
            {t("cancel")}
          </button>
        </div>
      </section>
  );
}
