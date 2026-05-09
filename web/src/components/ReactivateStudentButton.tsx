"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { reactivateTeacherStudent } from "@/app/students/[id]/edit/actions";

export default function ReactivateStudentButton({ studentId }: { studentId: string; studentName: string }) {
  const t = useTranslations("ReactivateStudent");
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-emerald-950"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await reactivateTeacherStudent(studentId);
        });
      }}
      type="button"
    >
      {isPending ? t("processing") : t("activate")}
    </button>
  );
}
