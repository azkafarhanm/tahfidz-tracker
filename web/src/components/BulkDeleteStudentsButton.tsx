"use client";

import { useTranslations } from "next-intl";
import TypeToConfirmButton from "@/components/TypeToConfirmButton";
import { useScrollPreservingRefresh } from "@/hooks/useScrollPreservingRefresh";
import { deleteAllArchivedStudents } from "@/app/admin/academic-years/archive-actions";
import type { DeletionImpact } from "@/app/admin/academic-years/archive-actions";

type BulkDeleteStudentsButtonProps = {
  yearId: string;
  impact: DeletionImpact;
};

export default function BulkDeleteStudentsButton({
  yearId,
  impact,
}: BulkDeleteStudentsButtonProps) {
  const t = useTranslations("AdminAcademicYear");
  const refresh = useScrollPreservingRefresh();

  const impactItems = [
    { label: t("impactSantri"), count: impact.studentCount },
    { label: t("impactHafalan"), count: impact.memorizationCount },
    { label: t("impactMurojaah"), count: impact.revisionCount },
    { label: t("impactTarget"), count: impact.targetCount },
    { label: t("impactSumatif"), count: impact.summativeCount },
    { label: t("impactTasmi"), count: impact.tasmiCount },
  ].filter((item) => item.count > 0);

  return (
    <TypeToConfirmButton
      cancelLabel={t("cancelDelete")}
      confirmLabel={t("confirmBulkDelete")}
      confirmMessage={t("confirmBulkDeleteMessage")}
      confirmWord="HAPUS"
      dialogTitle={t("bulkDeleteTitle")}
      disabled={impact.studentCount === 0}
      disabledReason={impact.studentCount === 0 ? t("noStudentsToDelete") : undefined}
      impactItems={impactItems}
      label={t("bulkDelete")}
      onAction={async () => {
        const result = await deleteAllArchivedStudents(yearId);
        refresh();
        return result;
      }}
      pendingLabel={t("deleting")}
      warningMessage={t("bulkDeleteWarning")}
    />
  );
}
