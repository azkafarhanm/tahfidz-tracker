"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PencilLine } from "lucide-react";
import { useTranslations } from "next-intl";
import DeleteRecordButton from "@/components/DeleteRecordButton";

type FormativeRecord = {
  id: string;
  type: string;
  range: string;
  score: number | null;
  status: string;
  date: string;
  time: string;
  dateTimeIso: string;
  notes: string | null;
};

type FormativeRecordsTableProps = {
  emptyDescription: string;
  emptyHeading: string;
  records: FormativeRecord[];
  returnTo: string;
  studentId: string;
};

export default function FormativeRecordsTable({
  emptyDescription,
  emptyHeading,
  records,
  returnTo,
  studentId,
}: FormativeRecordsTableProps) {
  const t = useTranslations("Formative");
  const [hiddenRecordIds, setHiddenRecordIds] = useState<Set<string>>(new Set());

  const visibleRecords = useMemo(
    () => records.filter((record) => !hiddenRecordIds.has(record.id)),
    [hiddenRecordIds, records],
  );

  if (visibleRecords.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-600 dark:text-slate-400">
        <p className="font-medium">{emptyHeading}</p>
        <p className="mt-1">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-800">
            <th className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
              {t("colType")}
            </th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
              {t("colMaterial")}
            </th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
              {t("colScore")}
            </th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
              {t("colStatus")}
            </th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
              {t("colRecordedAt")}
            </th>
            <th className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
              {t("colNotes")}
            </th>
            <th className="px-5 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
              {t("colAction")}
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleRecords.map((record, index) => {
            const recordType = record.type === "Murojaah" ? "murojaah" : "hafalan";
            const editHref = `/students/${studentId}/records/${recordType}/${record.id}/edit?returnTo=${encodeURIComponent(returnTo)}`;

            return (
              <tr
                key={`${record.type}-${record.id}`}
                className={`border-b border-slate-100 dark:border-slate-800 ${
                  index % 2 === 1 ? "bg-slate-50/60 dark:bg-slate-800/20" : ""
                }`}
              >
                <td className="px-5 py-4">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                    {record.type}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                  {record.range}
                </td>
                <td className="px-4 py-4">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                    {record.score ?? "-"}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                  {record.status}
                </td>
                <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                  {record.date} - {record.time}
                </td>
                <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                  {record.notes || "-"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      href={editHref}
                    >
                      <PencilLine aria-hidden="true" size={14} strokeWidth={2.2} />
                      {t("editButton")}
                    </Link>
                    <DeleteRecordButton
                      compact
                      navigateOnSuccess={false}
                      onDeleteError={() => {
                        setHiddenRecordIds((current) => {
                          const next = new Set(current);
                          next.delete(record.id);
                          return next;
                        });
                      }}
                      onDeleteStart={() => {
                        setHiddenRecordIds((current) => new Set(current).add(record.id));
                      }}
                      recordId={record.id}
                      recordType={recordType}
                      returnTo={returnTo}
                      studentId={studentId}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
