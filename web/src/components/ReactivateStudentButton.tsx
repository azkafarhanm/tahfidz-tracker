"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { reactivateTeacherStudent } from "@/app/students/[id]/edit/actions";
import { playNotificationSound } from "@/lib/feedback";

export default function ReactivateStudentButton({
  studentId,
  studentName: _studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const t = useTranslations("ReactivateStudent");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  void _studentName;

  return (
    <div className="flex flex-col items-end gap-1">
      {error ? <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
      <button
        aria-busy={isPending}
        className="rounded-lg border border-emerald-200/80 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50/80 hover:border-emerald-300 disabled:opacity-60 dark:border-emerald-900/60 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await reactivateTeacherStudent(studentId);
            if (result.ok) {
              if (result.message) {
                toast.success(result.message);
                playNotificationSound("success");
              }
              router.refresh();
            } else {
              setError(result.error);
              toast.error(result.error);
              playNotificationSound("error");
            }
          });
        }}
        type="button"
      >
        {isPending ? t("processing") : t("activate")}
      </button>
    </div>
  );
}
