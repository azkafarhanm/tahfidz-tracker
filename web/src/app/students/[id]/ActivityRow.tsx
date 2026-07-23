"use client";

import { useState } from "react";
import { BookOpen, PencilLine, RotateCcw, Trash2, Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { deleteRecord } from "@/lib/record-actions";
import { deleteTasmiAction } from "./tasmi/actions";
import { actionButtonClass } from "@/components/action-button-styles";
import { badge } from "@/lib/colors";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import { useScrollPreservingRefresh } from "@/hooks/useScrollPreservingRefresh";

type RecordItem = {
  id: string;
  type: string;
  range: string;
  date: string;
  time?: string;
  status: string;
  score: number | null;
  needsReview: boolean;
  notes?: string | null;
  grade?: string;
  juz?: number;
  examinerName?: string;
};

function recordStatusClass(record: RecordItem) {
  return record.needsReview ? badge.warning : badge.success;
}

export default function ActivityRow({
  detailHref,
  record,
  studentId,
}: {
  detailHref: string;
  record: RecordItem;
  studentId: string;
}) {
  const t = useTranslations("StudentDetail");
  const tDel = useTranslations("DeleteRecord");
  const refresh = useScrollPreservingRefresh();
  const [deleted, setDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isTasmi = record.type === "Tasmi'";
  const Icon = isTasmi ? Award : record.type === "Hafalan" ? BookOpen : RotateCcw;
  const [, detailQuery = ""] = detailHref.split("?", 2);
  const detailParams = new URLSearchParams(detailQuery);
  const programType = detailParams.get("programType");
  const editHref = isTasmi
    ? `/students/${studentId}/tasmi/${record.id}/edit${programType ? `?programType=${programType}` : ""}`
    : `/students/${studentId}/records/${record.type === "Hafalan" ? "hafalan" : "murojaah"}/${record.id}/edit?returnTo=${encodeURIComponent(detailHref)}`;

  if (deleted) return null;

  return (
    <article data-highlight={record.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isTasmi ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"}`}>
          <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {isTasmi ? t("tasmiButton") : record.type === "Hafalan" ? t("hafalanButton") : t("murojaahButton")}
              </p>
              <p className="mt-0.5 truncate text-[13px] leading-snug text-slate-500 dark:text-slate-400">
                {record.range}
                {isTasmi && record.grade ? ` - ${record.grade}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right text-[11px] font-medium text-slate-400 dark:text-slate-500">
              <p>{record.date}</p>
              {record.time ? <p className="mt-1">{record.time}</p> : null}
            </div>
          </div>
          <div className="mt-3 flex w-full min-w-0 flex-wrap items-center justify-end gap-2">
            <div className="mr-auto flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
              <span className={`max-w-full rounded-full px-2.5 py-0.5 text-center text-[11px] font-semibold leading-tight [overflow-wrap:anywhere] ${recordStatusClass(record)}`}>
                {record.status}
              </span>
              {record.score !== null ? (
                <span className={`rounded-full ${badge.neutral} px-2.5 py-0.5 text-[11px] font-semibold leading-tight`}>
                  {t("scoreLabel")} {record.score}
                </span>
              ) : null}
            </div>
            <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5">
              <WorkflowContextLink
                className={actionButtonClass("neutral")}
                href={editHref}
              >
                <PencilLine aria-hidden="true" size={12} strokeWidth={2.2} />
                {t("editButton")}
              </WorkflowContextLink>
              <ConfirmActionDialogButton
                cancelLabel={tDel("cancel")}
                confirmLabel={tDel("confirmDelete")}
                confirmMessage={tDel("confirmMessage")}
                dialogTitle={tDel("delete")}
                icon={<Trash2 aria-hidden="true" size={12} strokeWidth={2.2} />}
                label={tDel("delete")}
                onAction={async () => {
                  setDeleteError(null);
                  if (isTasmi) {
                    const result = await deleteTasmiAction(record.id, studentId);
                    if (result.ok) {
                      setDeleted(true);
                      refresh();
                    }
                    return { ok: result.ok, error: result.error, success: result.message };
                  }
                  const result = await deleteRecord(studentId, record.type === "Hafalan" ? "hafalan" : "murojaah", record.id, detailHref);
                  if (result.ok) {
                    setDeleted(true);
                    refresh();
                  }
                  return { ok: result.ok, error: result.error, success: result.success };
                }}
                onError={(msg) => setDeleteError(msg)}
                pendingLabel={tDel("deleting")}
                tone="danger"
              />
            </div>
          </div>
          {deleteError ? (
            <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">{deleteError}</p>
          ) : null}
          {record.notes ? (
            <p className="mt-3 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{record.notes}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
