"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteTeacherStudent } from "@/app/students/[id]/edit/actions";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";

type DeleteStudentButtonProps = {
  disabledReason?: string;
  onDeleteError?: (error: string) => void;
  onDeleteStart?: () => void;
  studentId: string;
};

export default function DeleteStudentButton({
  disabledReason,
  onDeleteError,
  onDeleteStart,
  studentId,
}: DeleteStudentButtonProps) {
  const t = useTranslations("DeleteStudent");
  const router = useRouter();

  return (
    <ConfirmActionDialogButton
      cancelLabel={t("buttonCancel")}
      confirmLabel={t("buttonConfirm")}
      confirmMessage={t("confirmMessage")}
      disabled={Boolean(disabledReason)}
      disabledReason={disabledReason}
      icon={<Trash2 aria-hidden="true" size={12} strokeWidth={2.2} />}
      label={t("buttonDelete")}
      onAction={async () => {
        onDeleteStart?.();
        const result = await deleteTeacherStudent(studentId);
        router.refresh();
        return result;
      }}
      onError={(message) => onDeleteError?.(message)}
      pendingLabel={t("buttonProcessing")}
      tone="danger"
    />
  );
}
