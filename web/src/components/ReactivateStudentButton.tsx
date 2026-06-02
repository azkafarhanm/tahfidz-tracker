"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { reactivateTeacherStudent } from "@/app/students/[id]/edit/actions";
import { actionButtonClass } from "@/components/action-button-styles";
import { playNotificationSound } from "@/lib/feedback";

export default function ReactivateStudentButton({
  onReactivateSuccess,
  studentId,
  studentName: _studentName,
}: {
  onReactivateSuccess?: () => void;
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
        className={actionButtonClass("success")}
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
              onReactivateSuccess?.();
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
