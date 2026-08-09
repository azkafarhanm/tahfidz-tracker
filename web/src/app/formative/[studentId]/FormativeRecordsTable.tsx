"use client";

import { useMemo, useState } from "react";
import { PencilLine } from "lucide-react";
import { useTranslations } from "next-intl";
import DeleteRecordButton from "@/components/DeleteRecordButton";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import FormativeTableScroll from "../FormativeTableScroll";
import { actionButtonClass } from "@/components/action-button-styles";
import { badge } from "@/lib/colors";

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

function splitMaterialForMobile(range: string) {
  const separatorIndex = range.lastIndexOf(" - ");

  if (separatorIndex === -1) {
    return { range, juz: null };
  }

  return {
    range: range.slice(0, separatorIndex),
    juz: range.slice(separatorIndex + 3),
  };
}

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
      <div className="m-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{emptyHeading}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 p-4 sm:hidden">
        {visibleRecords.map((record) => {
          const recordType = record.type === "Murojaah" ? "murojaah" : "hafalan";
          const editHref = `/students/${studentId}/records/${recordType}/${record.id}/edit?returnTo=${encodeURIComponent(returnTo)}`;
          const material = splitMaterialForMobile(record.range);

          return (
            <article
              key={`${record.type}-${record.id}`}
              className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
              data-highlight={record.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className={`inline-flex rounded-full ${badge.success} px-3 py-1 text-xs font-medium`}>
                    {record.type}
                  </span>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("colMaterial")}
                  </p>
                  <p className="mt-1 break-words font-medium text-slate-900 dark:text-slate-100">
                    {material.range}
                  </p>
                  {material.juz ? (
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                      {material.juz}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("colScore")}
                  </p>
                  <p className="mt-1 font-semibold text-emerald-800 dark:text-emerald-400">
                    {record.score ?? "-"}
                  </p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("colStatus")}
                  </dt>
                  <dd className="mt-1 break-words text-slate-700 dark:text-slate-300">{record.status}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("colRecordedAt")}
                  </dt>
                  <dd className="mt-1 text-slate-700 dark:text-slate-300">
                    {record.date} - {record.time}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("colNotes")}
                  </dt>
                  <dd className="mt-1 break-words text-slate-700 dark:text-slate-300">
                    {record.notes || "-"}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <WorkflowContextLink
                  className={actionButtonClass("neutral")}
                  href={editHref}
                >
                  <PencilLine aria-hidden="true" size={14} strokeWidth={2.2} />
                  {t("editButton")}
                </WorkflowContextLink>
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
                  onDeleteSuccess={() => {
                    setHiddenRecordIds((current) => new Set(current).add(record.id));
                  }}
                  recordId={record.id}
                  recordType={recordType}
                  returnTo={returnTo}
                  studentId={studentId}
                />
              </div>
            </article>
          );
        })}
      </div>

      <FormativeTableScroll className="hidden overflow-x-auto sm:block" storageKey="formative:detail:hscroll">
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
                data-highlight={record.id}
              >
                <td className="px-5 py-4">
                  <span className={`rounded-full ${badge.success} px-3 py-1 text-xs font-medium`}>
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
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <WorkflowContextLink
                      className={actionButtonClass("neutral")}
                      href={editHref}
                    >
                      <PencilLine aria-hidden="true" size={14} strokeWidth={2.2} />
                      {t("editButton")}
                    </WorkflowContextLink>
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
                      onDeleteSuccess={() => {
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
      </FormativeTableScroll>
    </>
  );
}
