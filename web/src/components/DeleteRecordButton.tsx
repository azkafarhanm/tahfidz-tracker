"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { deleteRecord } from "@/lib/record-actions";

type DeleteRecordButtonProps = {
  studentId: string;
  recordType: "hafalan" | "murojaah";
  recordId: string;
  returnTo?: string;
  compact?: boolean;
  navigateOnSuccess?: boolean;
  onDeleteStart?: () => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: string) => void;
};

export default function DeleteRecordButton({
  studentId,
  recordType,
  recordId,
  returnTo,
  compact = false,
  navigateOnSuccess = true,
  onDeleteStart,
  onDeleteSuccess,
  onDeleteError,
}: DeleteRecordButtonProps) {
  const t = useTranslations("DeleteRecord");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);
  const fallbackRedirectTo = returnTo ?? `/students/${studentId}`;

  const baseClassName = compact
    ? "rounded-lg px-3 py-2 text-xs"
    : "rounded-xl px-3 py-2 text-xs";

  if (!confirmed) {
    return (
      <button
        className={`${baseClassName} border border-red-200 bg-white font-semibold text-red-700 transition hover:bg-red-50`}
        onClick={() => setConfirmed(true)}
        type="button"
      >
        {t("delete")}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className={`${baseClassName} bg-red-700 font-semibold text-white transition hover:bg-red-800 disabled:opacity-60`}
        disabled={isPending}
        onClick={() => {
          onDeleteStart?.();
          startTransition(async () => {
            const result = await deleteRecord(studentId, recordType, recordId, returnTo);

            if (result.ok) {
              setConfirmed(false);
              onDeleteSuccess?.();

              if (navigateOnSuccess) {
                router.replace(result.redirectTo ?? fallbackRedirectTo);
              } else {
                router.refresh();
              }
              return;
            }

            setConfirmed(false);
            onDeleteError?.(result.error ?? t("delete"));

            if (navigateOnSuccess) {
              router.replace(result.redirectTo ?? fallbackRedirectTo);
            }
          });
        }}
        type="button"
      >
        {isPending ? t("deleting") : t("confirmDelete")}
      </button>
      <button
        className={`${baseClassName} border border-slate-200 bg-white font-semibold text-slate-600 transition hover:bg-slate-50`}
        onClick={() => setConfirmed(false)}
        type="button"
      >
        {t("cancel")}
      </button>
    </div>
  );
}
