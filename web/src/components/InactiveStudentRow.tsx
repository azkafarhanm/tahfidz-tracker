"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import DeleteStudentButton from "@/components/DeleteStudentButton";
import InitialsAvatar from "@/components/InitialsAvatar";
import ReactivateStudentButton from "@/components/ReactivateStudentButton";

type InactiveStudentRowProps = {
  activeTargetCount: number;
  classSummary: string;
  fullName: string;
  id: string;
  summativeScoreCount: number;
  totalRecordCount: number;
};

export default function InactiveStudentRow({
  activeTargetCount,
  classSummary,
  fullName,
  id,
  summativeScoreCount,
  totalRecordCount,
}: InactiveStudentRowProps) {
  const t = useTranslations("Students");
  const [isOptimisticallyDeleted, setIsOptimisticallyDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteBlockers = [
    totalRecordCount > 0
      ? t("deleteBlockedRecordItem", { count: totalRecordCount })
      : null,
    summativeScoreCount > 0
      ? t("deleteBlockedSummativeItem", { count: summativeScoreCount })
      : null,
    activeTargetCount > 0
      ? t("deleteBlockedTargetItem", { count: activeTargetCount })
      : null,
  ].filter(Boolean);
  const deleteDisabledReason =
    deleteBlockers.length > 0
      ? t("deleteBlockedReason", { items: deleteBlockers.join(", ") })
      : undefined;

  if (isOptimisticallyDeleted) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      {error ? (
        <p className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <InitialsAvatar name={fullName} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-950 dark:text-white">
              {fullName}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {classSummary}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ReactivateStudentButton studentId={id} studentName={fullName} />
          <DeleteStudentButton
            disabledReason={deleteDisabledReason}
            onDeleteError={(message) => {
              setIsOptimisticallyDeleted(false);
              setError(message);
            }}
            onDeleteStart={() => {
              setError(null);
              setIsOptimisticallyDeleted(true);
            }}
            studentId={id}
          />
        </div>
      </div>
    </div>
  );
}
