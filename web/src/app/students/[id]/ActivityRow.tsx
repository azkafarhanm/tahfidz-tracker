"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, PencilLine, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { deleteRecord } from "@/lib/record-actions";
import { actionButtonClass } from "@/components/action-button-styles";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";

type RecordItem = {
  id: string;
  type: string;
  range: string;
  date: string;
  status: string;
  score: number | null;
  needsReview: boolean;
  notes?: string | null;
};

function recordStatusClass(record: RecordItem) {
  return record.needsReview
    ? "bg-amber-100 text-amber-800"
    : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400";
}

export default function ActivityRow({
  record,
  studentId,
}: {
  record: RecordItem;
  studentId: string;
}) {
  const t = useTranslations("StudentDetail");
  const tDel = useTranslations("DeleteRecord");
  const router = useRouter();
  const [deleted, setDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const Icon = record.type === "Hafalan" ? BookOpen : RotateCcw;
  const recordType = record.type === "Hafalan" ? "hafalan" : "murojaah";
  const editHref = `/students/${studentId}/records/${recordType}/${record.id}/edit?returnTo=${encodeURIComponent(`/students/${studentId}`)}`;

  if (deleted) return null;

  return (
    <article data-highlight={record.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {record.type === "Hafalan" ? t("hafalanButton") : t("murojaahButton")}
              </p>
              <p className="mt-0.5 truncate text-[13px] leading-snug text-slate-500 dark:text-slate-400">
                {record.range}
              </p>
            </div>
            <p className="shrink-0 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {record.date}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-tight ${recordStatusClass(record)}`}>
                {record.status}
              </span>
              {record.score !== null ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold leading-tight text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {t("scoreLabel")} {record.score}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                className={actionButtonClass("neutral")}
                href={editHref}
              >
                <PencilLine aria-hidden="true" size={12} strokeWidth={2.2} />
                {t("editButton")}
              </Link>
              <ConfirmActionDialogButton
                cancelLabel={tDel("cancel")}
                confirmLabel={tDel("confirmDelete")}
                confirmMessage={tDel("confirmMessage")}
                dialogTitle={tDel("delete")}
                icon={<Trash2 aria-hidden="true" size={12} strokeWidth={2.2} />}
                label={tDel("delete")}
                onAction={async () => {
                  setDeleteError(null);
                  const result = await deleteRecord(studentId, recordType, record.id, `/students/${studentId}`);
                  if (result.ok) {
                    setDeleted(true);
                    router.refresh();
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
