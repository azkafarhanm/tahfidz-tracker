"use client";

import { useTranslations } from "next-intl";
import DeleteStudentButton from "@/components/DeleteStudentButton";
import InitialsAvatar from "@/components/InitialsAvatar";
import StudentCardActions from "@/components/StudentCardActions";

type InactiveStudentRowProps = {
  activeTargetCount: number;
  classSummary: string;
  error?: string | null;
  fullName: string;
  id: string;
  onDeleteError: (error: string) => void;
  onDeleteStart: () => void;
  onDeleteRollback: () => void;
  onReactivateSuccess: () => void;
  onReactivateRollback: () => void;
};

export default function InactiveStudentRow({
  activeTargetCount,
  classSummary,
  error,
  fullName,
  id,
  onDeleteError,
  onDeleteStart,
  onDeleteRollback,
  onReactivateSuccess,
  onReactivateRollback,
}: InactiveStudentRowProps) {
  const t = useTranslations("Students");

  const deleteDisabledReason =
    activeTargetCount > 0
      ? t("deleteBlockedReason", {
          items: t("deleteBlockedTargetItem", { count: activeTargetCount }),
        })
      : undefined;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      {error ? (
        <p className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <StudentCardActions
            canManage
            isActive={false}
            onStatusChanged={onReactivateSuccess}
            onStatusRollback={onReactivateRollback}
            studentId={id}
            studentName={fullName}
          />
          <DeleteStudentButton
            disabledReason={deleteDisabledReason}
            onDeleteError={onDeleteError}
            onDeleteRollback={onDeleteRollback}
            onDeleteStart={onDeleteStart}
            studentId={id}
          />
        </div>
      </div>
    </div>
  );
}
