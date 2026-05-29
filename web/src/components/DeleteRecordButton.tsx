"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { deleteRecord } from "@/lib/record-actions";
import InlineConfirmActionButton from "@/components/InlineConfirmActionButton";

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
  void compact;
  const fallbackRedirectTo = returnTo ?? `/students/${studentId}`;

  return (
    <InlineConfirmActionButton
      cancelLabel={t("cancel")}
      confirmLabel={t("confirmDelete")}
      confirmMessage={t("confirmMessage")}
      icon={<Trash2 aria-hidden="true" size={14} strokeWidth={2.2} />}
      label={t("delete")}
      onAction={async () => {
        onDeleteStart?.();
        const result = await deleteRecord(studentId, recordType, recordId, returnTo);

        if (result.ok) {
          onDeleteSuccess?.();

          if (navigateOnSuccess) {
            setTimeout(() => router.replace(result.redirectTo ?? fallbackRedirectTo), 400);
          } else {
            router.refresh();
          }
        } else if (navigateOnSuccess) {
          router.replace(result.redirectTo ?? fallbackRedirectTo);
        }

        return {
          ok: result.ok,
          error: result.error,
          success: result.success,
        };
      }}
      onError={(message) => onDeleteError?.(message)}
      pendingLabel={t("deleting")}
      tone="danger"
    />
  );
}
