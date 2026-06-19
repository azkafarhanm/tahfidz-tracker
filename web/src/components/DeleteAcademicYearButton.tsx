"use client";

import { useTranslations } from "next-intl";
import TypeToConfirmButton from "@/components/TypeToConfirmButton";
import { useScrollPreservingRefresh } from "@/hooks/useScrollPreservingRefresh";
import { deleteAcademicYear } from "@/app/admin/academic-years/archive-actions";
import type { YearDeletionCheck } from "@/app/admin/academic-years/archive-actions";

type DeleteAcademicYearButtonProps = {
  yearId: string;
  yearName: string;
  check: YearDeletionCheck;
};

export default function DeleteAcademicYearButton({
  yearId,
  yearName,
  check,
}: DeleteAcademicYearButtonProps) {
  const t = useTranslations("AdminAcademicYear");
  const refresh = useScrollPreservingRefresh();

  const { canDelete, counts } = check;

  const impactItems = [
    { label: t("impactSantri"), count: counts.studentCount },
    { label: t("impactHafalan"), count: counts.memorizationCount },
    { label: t("impactMurojaah"), count: counts.revisionCount },
    { label: t("impactTarget"), count: counts.targetCount },
    { label: t("impactSumatif"), count: counts.summativeCount },
    { label: t("impactHalaqah"), count: counts.classGroupCount },
  ].filter((item) => item.count > 0);

  const hasData = !canDelete;

  return (
    <TypeToConfirmButton
      cancelLabel={t("cancelDelete")}
      confirmLabel={t("confirmDeleteYear")}
      confirmMessage={t("confirmDeleteYearMessage", { year: yearName })}
      confirmWord="HAPUS"
      dialogTitle={t("deleteYearTitle")}
      disabled={hasData}
      disabledReason={hasData ? t("yearStillHasData") : undefined}
      impactItems={hasData ? impactItems : undefined}
      label={t("deleteYear")}
      onAction={async () => {
        const result = await deleteAcademicYear(yearId);
        refresh();
        return result;
      }}
      pendingLabel={t("deleting")}
      warningMessage={t("deleteYearWarning")}
    />
  );
}
