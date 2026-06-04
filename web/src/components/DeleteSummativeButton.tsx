"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { deleteSummativeAssessmentAction } from "@/app/summative/actions";
import InlineConfirmActionButton from "@/components/InlineConfirmActionButton";

type DeleteSummativeButtonProps = {
  assessmentId: string;
  compact?: boolean;
  navigateOnSuccess?: boolean;
  onDeleteStart?: () => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: string) => void;
  semester: string;
  studentId: string;
};

export default function DeleteSummativeButton({
  assessmentId,
  compact = false,
  navigateOnSuccess = true,
  onDeleteStart,
  onDeleteSuccess,
  onDeleteError,
  semester,
  studentId,
}: DeleteSummativeButtonProps) {
  const t = useTranslations("DeleteRecord");
  const router = useRouter();
  void compact;
  const fallbackRedirectTo = `/summative/${studentId}?semester=${semester}`;

  return (
    <InlineConfirmActionButton
      cancelLabel={t("cancel")}
      confirmLabel={t("confirmDelete")}
      confirmMessage={t("confirmMessage")}
      icon={<Trash2 aria-hidden="true" size={14} strokeWidth={2.2} />}
      label={t("delete")}
      onAction={async () => {
        onDeleteStart?.();
        const formData = new FormData();
        formData.set("assessmentId", assessmentId);
        formData.set("studentId", studentId);
        formData.set("semester", semester);

        const result = await deleteSummativeAssessmentAction(formData);
        if (result.ok) {
          onDeleteSuccess?.();

          if (navigateOnSuccess) {
            setTimeout(() => router.replace(result.redirectTo ?? fallbackRedirectTo), 400);
          } else {
            router.refresh();
          }
        } else if (navigateOnSuccess) {
          router.replace(result.redirectTo ?? fallbackRedirectTo);
        } else {
          router.refresh();
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
