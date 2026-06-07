"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { reactivateTeacherStudent } from "@/app/students/[id]/edit/actions";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";

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
  void _studentName;

  return (
    <ConfirmActionDialogButton
      cancelLabel={t("cancelLabel")}
      confirmLabel={t("confirmLabel")}
      confirmMessage={t("confirmMessage")}
      dialogTitle={t("activate")}
      icon={<RotateCcw aria-hidden="true" size={12} strokeWidth={2.2} />}
      label={t("activate")}
      onAction={async () => {
        const result = await reactivateTeacherStudent(studentId);
        if (result.ok) {
          onReactivateSuccess?.();
          router.refresh();
        }
        return result;
      }}
      pendingLabel={t("processing")}
      tone="success"
    />
  );
}
