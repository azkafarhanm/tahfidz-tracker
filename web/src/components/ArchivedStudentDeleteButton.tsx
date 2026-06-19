"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";
import { useScrollPreservingRefresh } from "@/hooks/useScrollPreservingRefresh";
import { deleteArchivedStudent } from "@/app/admin/academic-years/archive-actions";

type ArchivedStudentDeleteButtonProps = {
  yearId: string;
  studentId: string;
  studentName: string;
};

export default function ArchivedStudentDeleteButton({
  yearId,
  studentId,
  studentName,
}: ArchivedStudentDeleteButtonProps) {
  const t = useTranslations("AdminAcademicYear");
  const refresh = useScrollPreservingRefresh();

  return (
    <ConfirmActionDialogButton
      cancelLabel={t("cancelDelete")}
      confirmLabel={t("confirmDeleteStudent")}
      confirmMessage={t("confirmDeleteStudentMessage", { name: studentName })}
      dialogTitle={t("deleteStudent")}
      icon={<Trash2 aria-hidden="true" size={12} strokeWidth={2.2} />}
      label={t("delete")}
      onAction={async () => {
        const result = await deleteArchivedStudent(yearId, studentId);
        refresh();
        return result;
      }}
      pendingLabel={t("deleting")}
      tone="danger"
    />
  );
}
